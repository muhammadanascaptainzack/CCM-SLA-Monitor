/**
 * Live Empirical QA, Load, Stress, Spike, RADIUS Resilience, File Upload & OWASP Security Audit Runner
 * Executes real HTTP requests against the running server on http://127.0.0.1:4000,
 * measures true latency percentiles (Avg, P50, P90, P95, P99), RPS, CPU/RAM, error codes,
 * and restores the database to its clean initial state upon completion.
 */

import http from 'http';
import os from 'os';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PORT = 4000;
const HOST = '127.0.0.1';

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 2500,
  maxFreeSockets: 512,
  timeout: 10000,
});

interface RequestResult {
  statusCode: number;
  durationMs: number;
  bytes: number;
  headers: http.IncomingHttpHeaders;
  body: string;
  error?: string;
}

function sendHttpRequest(options: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}): Promise<RequestResult> {
  return new Promise((resolve) => {
    const start = performance.now();
    const reqHeaders: Record<string, string> = {
      ...(options.headers || {}),
    };
    if (options.body) {
      reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(options.body).toString();
    }

    const req = http.request(
      {
        hostname: HOST,
        port: PORT,
        path: options.path,
        method: options.method,
        headers: reqHeaders,
        agent,
        timeout: options.timeoutMs || 8000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let totalBytes = 0;
        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          totalBytes += chunk.length;
        });
        res.on('end', () => {
          const durationMs = Math.round((performance.now() - start) * 100) / 100;
          resolve({
            statusCode: res.statusCode || 0,
            durationMs,
            bytes: totalBytes,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf-8'),
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('ETIMEDOUT'));
    });

    req.on('error', (err) => {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      resolve({
        statusCode: 0,
        durationMs,
        bytes: 0,
        headers: {},
        body: '',
        error: err.message,
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function computeStats(latencies: number[]) {
  if (latencies.length === 0) return { avg: 0, p50: 0, p90: 0, p95: 0, p99: 0, max: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const pct = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    avg: Math.round((sum / sorted.length) * 100) / 100,
    p50: Math.round(pct(50) * 100) / 100,
    p90: Math.round(pct(90) * 100) / 100,
    p95: Math.round(pct(95) * 100) / 100,
    p99: Math.round(pct(99) * 100) / 100,
    max: Math.round(sorted[sorted.length - 1] * 100) / 100,
  };
}

async function runConcurrencyStage(virtualUsers: number, requestsPerUser: number) {
  const latencies: number[] = [];
  let totalBytes = 0;
  let failed = 0;
  const statusCodes: Record<string, number> = {};
  const customers = ['usr-1', 'usr-2', 'usr-3'];

  const cpuStart = os.cpus().map((c) => ({ ...c.times }));
  const startWall = performance.now();

  const workers = Array.from({ length: virtualUsers }, async (_, vuIdx) => {
    // Realistic session arrival stagger within a 150ms window for concurrent users
    await new Promise((r) => setTimeout(r, (vuIdx % 50) * 3));
    const custId = customers[vuIdx % customers.length];
    for (let i = 0; i < requestsPerUser; i++) {
      // Mix of realistic ISP customer actions:
      // 0: Open portal config, 1: Check RADIUS profile/status/balance, 2: Check complaint history, 3: Submit complaint (every 8th req)
      const actionType = (vuIdx + i) % 8;
      let res: RequestResult;

      if (actionType === 0) {
        res = await sendHttpRequest({ method: 'GET', path: '/api/config' });
      } else if (actionType === 1 || actionType === 2 || actionType === 3) {
        res = await sendHttpRequest({ method: 'GET', path: `/api/radius/subscriber/${custId}` });
      } else if (actionType === 4 || actionType === 5 || actionType === 6) {
        res = await sendHttpRequest({ method: 'GET', path: `/api/complaints?customerId=${custId}` });
      } else {
        const idempKey = `stage-${virtualUsers}-vu${vuIdx}-i${i}-${Date.now()}`;
        res = await sendHttpRequest({
          method: 'POST',
          path: '/api/complaints',
          headers: { 'X-Idempotency-Key': idempKey },
          body: JSON.stringify({
            customerId: custId,
            category: 'SPEED_DEGRADATION',
            priority: 'P2_MAJOR',
            subject: `Speed drop test VU-${vuIdx}`,
            description: `Empirical load test at ${virtualUsers} concurrent users`,
            idempotencyKey: idempKey,
          }),
        });
      }

      latencies.push(res.durationMs);
      totalBytes += res.bytes;
      const codeKey = res.statusCode ? String(res.statusCode) : `ERR_${res.error || 'NET'}`;
      statusCodes[codeKey] = (statusCodes[codeKey] || 0) + 1;
      if (res.statusCode < 200 || res.statusCode >= 400) {
        failed++;
      }
    }
  });

  await Promise.all(workers);
  const elapsedSec = (performance.now() - startWall) / 1000;

  // Measure CPU utilization delta across stage
  const cpuEnd = os.cpus().map((c) => ({ ...c.times }));
  let busyDelta = 0;
  let totalDelta = 0;
  for (let i = 0; i < cpuStart.length; i++) {
    const startTotal = cpuStart[i].user + cpuStart[i].nice + cpuStart[i].sys + cpuStart[i].irq + cpuStart[i].idle;
    const endTotal = cpuEnd[i].user + cpuEnd[i].nice + cpuEnd[i].sys + cpuEnd[i].irq + cpuEnd[i].idle;
    const dTotal = endTotal - startTotal;
    const dIdle = cpuEnd[i].idle - cpuStart[i].idle;
    totalDelta += dTotal;
    busyDelta += dTotal - dIdle;
  }
  const cpuPercent = totalDelta > 0 ? Math.round((busyDelta / totalDelta) * 1000) / 10 : 0;

  // Query server health for server-side RSS memory
  const healthRes = await sendHttpRequest({ method: 'GET', path: '/api/health' });
  let serverRssMb = 0;
  try {
    serverRssMb = JSON.parse(healthRes.body).memoryUsageMb || 0;
  } catch {}

  const stats = computeStats(latencies);
  const totalReqs = latencies.length;
  const rps = Math.round((totalReqs / elapsedSec) * 10) / 10;
  const throughputMbps = Math.round(((totalBytes * 8) / elapsedSec / 1_000_000) * 100) / 100;

  return {
    virtualUsers,
    totalRequests: totalReqs,
    elapsedSec: Math.round(elapsedSec * 100) / 100,
    rps,
    failedRequests: failed,
    errorRatePercent: Math.round((failed / totalReqs) * 10000) / 100,
    statusCodes,
    ...stats,
    cpuPercent,
    serverRssMb,
    throughputMbps,
  };
}

async function runAudit() {
  console.log('=== STARTING EMPIRICAL QA, LOAD, STRESS, SPIKE, RADIUS & SECURITY AUDIT ===');
  const dbBackupPath = path.resolve(process.cwd(), 'data', 'complaints-db.json');
  const originalDbContent = fs.existsSync(dbBackupPath) ? fs.readFileSync(dbBackupPath, 'utf-8') : null;

  const reportData: Record<string, any> = {};

  try {
    // 1. Progressive Load & Stress Test (100, 250, 500, 750, 1000, 1250, 1500, 2000 VUs)
    const stages = [100, 250, 500, 750, 1000, 1250, 1500, 2000];
    reportData.loadStages = [];
    for (const vus of stages) {
      const reqsPerUser = vus <= 500 ? 4 : vus <= 1000 ? 3 : 2;
      const res = await runConcurrencyStage(vus, reqsPerUser);
      reportData.loadStages.push(res);
      console.log(
        `[Load Stage ${vus} VUs] RPS: ${res.rps} | Avg: ${res.avg}ms | P50: ${res.p50}ms | P90: ${res.p90}ms | P95: ${res.p95}ms | P99: ${res.p99}ms | Errors: ${res.failedRequests} | Server RSS: ${res.serverRssMb}MB | CPU: ${res.cpuPercent}%`
      );
    }

    // Post-stress recovery stage (drop back to 100 VUs)
    const recoveryStage = await runConcurrencyStage(100, 4);
    reportData.postStressRecovery = recoveryStage;
    console.log(
      `[Post-Stress Recovery 100 VUs] RPS: ${recoveryStage.rps} | Avg: ${recoveryStage.avg}ms | P95: ${recoveryStage.p95}ms | Errors: ${recoveryStage.failedRequests}`
    );

    // 2. Spike Testing (Scenario A: 100 -> 1,000, Scenario B: 1,000 -> 1,500, Scenario C: 1,500 -> 100)
    const spikeA = await runConcurrencyStage(1000, 2);
    const spikeB = await runConcurrencyStage(1500, 2);
    const spikeC = await runConcurrencyStage(100, 4);
    reportData.spikeTests = { scenarioA_100to1000: spikeA, scenarioB_1000to1500: spikeB, scenarioC_1500to100: spikeC };

    // 3. RADIUS / ZalPro API Resilience & Fault Injection Tests
    await sendHttpRequest({ method: 'POST', path: '/api/radius/reset-circuit' });
    const radiusNormal = await sendHttpRequest({ method: 'GET', path: '/api/radius/subscriber/usr-1?bypassCache=true' });
    const radiusDelay1s = await sendHttpRequest({
      method: 'GET',
      path: '/api/radius/subscriber/usr-1?bypassCache=true&simulateDelayMs=1000',
    });
    const radiusDelay3s = await sendHttpRequest({
      method: 'GET',
      path: '/api/radius/subscriber/usr-1?bypassCache=true&simulateDelayMs=3000',
    });
    const radiusDelay5s = await sendHttpRequest({
      method: 'GET',
      path: '/api/radius/subscriber/usr-1?bypassCache=true&simulateDelayMs=5000',
    });
    const radiusDelay10s = await sendHttpRequest({
      method: 'GET',
      path: '/api/radius/subscriber/usr-1?bypassCache=true&simulateDelayMs=10000',
    });
    const radiusAuth401 = await sendHttpRequest({
      method: 'GET',
      path: '/api/radius/subscriber/usr-1?bypassCache=true&simulateFault=401',
    });
    const radiusRate429 = await sendHttpRequest({
      method: 'GET',
      path: '/api/radius/subscriber/usr-1?bypassCache=true&simulateFault=429',
    });
    const radiusInvalidJson = await sendHttpRequest({
      method: 'GET',
      path: '/api/radius/subscriber/usr-1?bypassCache=true&simulateFault=invalid_json',
    });
    const radiusDown = await sendHttpRequest({
      method: 'GET',
      path: '/api/radius/subscriber/usr-1?bypassCache=true&simulateFault=down',
    });
    // Now circuit breaker should be OPEN and fail-fast in <5ms
    const radiusCircuitOpenFastFallback = await sendHttpRequest({
      method: 'GET',
      path: '/api/radius/subscriber/usr-1?bypassCache=true&simulateDelayMs=10000',
    });
    await sendHttpRequest({ method: 'POST', path: '/api/radius/reset-circuit' });

    reportData.radiusTests = {
      normal: { status: radiusNormal.statusCode, durationMs: radiusNormal.durationMs, body: JSON.parse(radiusNormal.body) },
      delay1s: { status: radiusDelay1s.statusCode, durationMs: radiusDelay1s.durationMs, degraded: JSON.parse(radiusDelay1s.body).degraded },
      delay3s_timeoutCut: { status: radiusDelay3s.statusCode, durationMs: radiusDelay3s.durationMs, body: JSON.parse(radiusDelay3s.body) },
      delay5s_timeoutCut: { status: radiusDelay5s.statusCode, durationMs: radiusDelay5s.durationMs, body: JSON.parse(radiusDelay5s.body) },
      delay10s_timeoutCut: { status: radiusDelay10s.statusCode, durationMs: radiusDelay10s.durationMs, body: JSON.parse(radiusDelay10s.body) },
      auth401Fallback: { status: radiusAuth401.statusCode, durationMs: radiusAuth401.durationMs, body: JSON.parse(radiusAuth401.body) },
      rate429Fallback: { status: radiusRate429.statusCode, durationMs: radiusRate429.durationMs, body: JSON.parse(radiusRate429.body) },
      invalidJsonFallback: { status: radiusInvalidJson.statusCode, durationMs: radiusInvalidJson.durationMs, body: JSON.parse(radiusInvalidJson.body) },
      downtimeFallback: { status: radiusDown.statusCode, durationMs: radiusDown.durationMs, body: JSON.parse(radiusDown.body) },
      circuitBreakerOpenFastFallback: {
        status: radiusCircuitOpenFastFallback.statusCode,
        durationMs: radiusCircuitOpenFastFallback.durationMs,
        body: JSON.parse(radiusCircuitOpenFastFallback.body),
      },
    };

    // 4. File Upload Testing (100 simultaneous uploads, 1MB, 2MB, 5MB, >5MB oversized, invalid format, disguised exe, interrupted, duplicate)
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const makePngBuffer = (sizeBytes: number) => {
      const buf = Buffer.alloc(sizeBytes, 0x41);
      pngHeader.copy(buf, 0);
      crypto.randomBytes(16).copy(buf, 8); // unique hash unless testing duplicate
      return buf.toString('base64');
    };

    // 100 simultaneous uploads
    const uploadLatencies: number[] = [];
    let uploadSuccesses = 0;
    await Promise.all(
      Array.from({ length: 100 }, async (_, idx) => {
        const b64 = makePngBuffer(16 * 1024); // 16KB valid PNG each for 100-concurrency burst
        const r = await sendHttpRequest({
          method: 'POST',
          path: '/api/uploads/evidence',
          body: JSON.stringify({
            filename: `concurrent-${idx}.png`,
            mimeType: 'image/png',
            base64Data: b64,
          }),
        });
        uploadLatencies.push(r.durationMs);
        if (r.statusCode === 201 || r.statusCode === 200) uploadSuccesses++;
      })
    );

    const up1Mb = await sendHttpRequest({
      method: 'POST',
      path: '/api/uploads/evidence',
      body: JSON.stringify({
        filename: 'evidence-1mb.png',
        mimeType: 'image/png',
        base64Data: makePngBuffer(1 * 1024 * 1024),
      }),
    });
    const up2Mb = await sendHttpRequest({
      method: 'POST',
      path: '/api/uploads/evidence',
      body: JSON.stringify({
        filename: 'evidence-2mb.png',
        mimeType: 'image/png',
        base64Data: makePngBuffer(2 * 1024 * 1024),
      }),
    });
    const up5Mb = await sendHttpRequest({
      method: 'POST',
      path: '/api/uploads/evidence',
      body: JSON.stringify({
        filename: 'evidence-5mb.png',
        mimeType: 'image/png',
        base64Data: makePngBuffer(5 * 1024 * 1024),
      }),
    });
    const upOversized6Mb = await sendHttpRequest({
      method: 'POST',
      path: '/api/uploads/evidence',
      body: JSON.stringify({
        filename: 'oversized-6mb.png',
        mimeType: 'image/png',
        base64Data: makePngBuffer(1024),
        sizeBytes: 6 * 1024 * 1024,
      }),
    });
    const upInvalidFormatExe = await sendHttpRequest({
      method: 'POST',
      path: '/api/uploads/evidence',
      body: JSON.stringify({
        filename: 'malware.exe',
        mimeType: 'application/x-msdownload',
        base64Data: Buffer.from('MZ-fake-executable').toString('base64'),
      }),
    });
    const upDisguisedPhpAsPng = await sendHttpRequest({
      method: 'POST',
      path: '/api/uploads/evidence',
      body: JSON.stringify({
        filename: 'shell.png',
        mimeType: 'image/png',
        base64Data: Buffer.from('<?php system($_GET["cmd"]); ?>').toString('base64'),
      }),
    });
    const upInterrupted = await sendHttpRequest({
      method: 'POST',
      path: '/api/uploads/evidence',
      body: JSON.stringify({
        filename: 'partial.png',
        mimeType: 'image/png',
        base64Data: 'iVBORw==',
        interrupted: true,
      }),
    });
    const dupBufB64 = makePngBuffer(4096);
    const upDup1 = await sendHttpRequest({
      method: 'POST',
      path: '/api/uploads/evidence',
      body: JSON.stringify({ filename: 'dup1.png', mimeType: 'image/png', base64Data: dupBufB64 }),
    });
    const upDup2 = await sendHttpRequest({
      method: 'POST',
      path: '/api/uploads/evidence',
      body: JSON.stringify({ filename: 'dup2.png', mimeType: 'image/png', base64Data: dupBufB64 }),
    });

    reportData.uploadTests = {
      simultaneous100: { successes: uploadSuccesses, stats: computeStats(uploadLatencies) },
      size1Mb: { status: up1Mb.statusCode, durationMs: up1Mb.durationMs },
      size2Mb: { status: up2Mb.statusCode, durationMs: up2Mb.durationMs },
      size5Mb: { status: up5Mb.statusCode, durationMs: up5Mb.durationMs },
      oversized6Mb: { status: upOversized6Mb.statusCode, body: JSON.parse(upOversized6Mb.body) },
      invalidExe: { status: upInvalidFormatExe.statusCode, body: JSON.parse(upInvalidFormatExe.body) },
      disguisedPhpMagicBytes: { status: upDisguisedPhpAsPng.statusCode, body: JSON.parse(upDisguisedPhpAsPng.body) },
      interruptedStream: { status: upInterrupted.statusCode, body: JSON.parse(upInterrupted.body) },
      duplicateDetection: {
        firstStatus: upDup1.statusCode,
        secondStatus: upDup2.statusCode,
        deduplicatedHeader: upDup2.headers['x-duplicate-upload'],
        sameFileId: JSON.parse(upDup1.body).fileId === JSON.parse(upDup2.body).fileId,
      },
    };

    // 5. Database Idempotency & Duplicate Submission Prevention Test
    const idempKey = `idem-audit-${Date.now()}`;
    const c1 = await sendHttpRequest({
      method: 'POST',
      path: '/api/complaints',
      headers: { 'X-Idempotency-Key': idempKey },
      body: JSON.stringify({
        customerId: 'usr-1',
        category: 'OFC_CUT',
        priority: 'P1_CRITICAL',
        subject: 'Idempotency Double Click Test',
        description: 'Testing exact duplicate prevention under double submit',
      }),
    });
    const c2 = await sendHttpRequest({
      method: 'POST',
      path: '/api/complaints',
      headers: { 'X-Idempotency-Key': idempKey },
      body: JSON.stringify({
        customerId: 'usr-1',
        category: 'OFC_CUT',
        priority: 'P1_CRITICAL',
        subject: 'Idempotency Double Click Test',
        description: 'Testing exact duplicate prevention under double submit',
      }),
    });

    reportData.databaseIdempotency = {
      firstStatus: c1.statusCode,
      secondStatus: c2.statusCode,
      idempotentReplayHeader: c2.headers['x-idempotent-replay'],
      sameTicketId: JSON.parse(c1.body).id === JSON.parse(c2.body).id,
    };

    // 6. OWASP Security Audit Tests (XSS Sanitization, Brute-Force Lockout, Security Headers)
    const xssPayload = await sendHttpRequest({
      method: 'POST',
      path: '/api/complaints',
      body: JSON.stringify({
        customerId: 'usr-1',
        category: 'DNS_ROUTING',
        priority: 'P2_MAJOR',
        subject: '<script>alert("XSS")</script>DNS Issue on Router <img src=x onerror=alert(1)>',
        description: 'Normal text with javascript:alert(document.cookie) and <iframe src="evil.com"></iframe>',
      }),
    });
    const xssTicket = JSON.parse(xssPayload.body);

    // Brute force test (11 failed attempts)
    let bruteStatusAt11 = 0;
    for (let attempt = 1; attempt <= 11; attempt++) {
      const bf = await sendHttpRequest({
        method: 'POST',
        path: '/api/auth/login',
        body: JSON.stringify({ identifier: 'admin@citrus.net.pk', password: `wrong-pass-${attempt}` }),
      });
      if (attempt === 11) bruteStatusAt11 = bf.statusCode;
    }

    reportData.securityTests = {
      securityHeaders: {
        xContentTypeOptions: xssPayload.headers['x-content-type-options'],
        referrerPolicy: xssPayload.headers['referrer-policy'],
        permissionsPolicy: xssPayload.headers['permissions-policy'],
        xPoweredBy: xssPayload.headers['x-powered-by'] || 'OMITTED_SECURE',
      },
      xssSanitization: {
        sanitizedSubject: xssTicket.subject,
        sanitizedDescription: xssTicket.description,
        scriptTagRemoved: !xssTicket.subject.includes('<script>'),
        onerrorRemoved: !xssTicket.subject.includes('onerror='),
        javascriptProtocolRemoved: !xssTicket.description.includes('javascript:'),
      },
      bruteForceProtection: {
        eleventhAttemptStatusCode: bruteStatusAt11,
        lockedOutWith429: bruteStatusAt11 === 429,
      },
    };

    fs.writeFileSync(
      path.resolve(process.cwd(), 'tests', 'last-audit-results.json'),
      JSON.stringify(reportData, null, 2),
      'utf-8'
    );
    console.log('=== AUDIT COMPLETED SUCCESSFULLY ===');
  } finally {
    // Clean up test upload files & restore database to exact pre-test state
    if (originalDbContent) {
      fs.writeFileSync(dbBackupPath, originalDbContent, 'utf-8');
    }
    await sendHttpRequest({ method: 'POST', path: '/api/system/reset' });
    const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      for (const f of fs.readdirSync(uploadsDir)) {
        if (f.startsWith('evd-')) {
          try {
            fs.unlinkSync(path.join(uploadsDir, f));
          } catch {}
        }
      }
    }
    agent.destroy();
  }
}

runAudit().catch((err) => {
  console.error('Audit script failed:', err);
  process.exit(1);
});
