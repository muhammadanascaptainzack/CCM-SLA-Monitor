import express, { Request, Response, NextFunction } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { storage } from './storage.js';
import { radiusService } from './radiusService.js';
import { ComplaintCategory, DistrictName, PTAMonthlyReport } from '../types/index.js';

export const apiRouter = express.Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB strict limit for complaint evidence screenshots
const uploadHashRegistry = new Map<string, { fileId: string; filename: string; sizeBytes: number; createdAt: string }>();

// Brute-force login rate limiter registry (per IP + identifier)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

// Real-time Request Telemetry & Latency Ring Buffer for Prometheus / Grafana
const latencyWindowMs: number[] = [];
const MAX_LATENCY_SAMPLES = 5000;
let activeConnections = 0;
let totalHttpRequests = 0;
let totalHttpErrors = 0;
const statusCounts: Record<number, number> = {};

export function recordRequestMetric(statusCode: number, durationMs: number): void {
  totalHttpRequests++;
  statusCounts[statusCode] = (statusCounts[statusCode] || 0) + 1;
  if (statusCode >= 400) totalHttpErrors++;
  if (latencyWindowMs.length >= MAX_LATENCY_SAMPLES) {
    latencyWindowMs.shift();
  }
  latencyWindowMs.push(durationMs);
}

export function trackActiveConnections(req: Request, res: Response, next: NextFunction): void {
  activeConnections++;
  const start = performance.now();
  res.on('finish', () => {
    activeConnections = Math.max(0, activeConnections - 1);
    recordRequestMetric(res.statusCode, Math.round((performance.now() - start) * 100) / 100);
  });
  next();
}

/**
 * XSS & Injection Sanitizer — strips dangerous script/HTML tags and event handlers
 * while preserving legitimate technical punctuation.
 */
export function sanitizeText(input: unknown, maxLen = 1500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*(iframe|object|embed|svg|link|style|meta)[^>]*>/gi, '')
    .replace(/on[a-z]+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/[<>]/g, (ch) => (ch === '<' ? '&lt;' : '&gt;'))
    .trim()
    .slice(0, maxLen);
}

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  OFC_CUT: 'Optical Fiber Cable (OFC) Cut / Media Outage',
  SPEED_DEGRADATION: 'Bandwidth Throttling / Speed Degradation',
  FREQUENT_DISCONNECT: 'Frequent Disconnection / High Attenuation',
  DNS_ROUTING: 'DNS & Upstream Routing Fault',
  CPE_ONT_FAULT: 'CPE / Router / ONT Hardware Fault',
  BILLING_PAYMENT: 'Billing Discrepancy & Sales Tax Dispute',
  NEW_PROVISIONING: 'New Provisioning & Shifting Delay'
};

// Apply telemetry tracking across all /api routes
apiRouter.use(trackActiveConnections);

// Health and Linux server diagnostics
apiRouter.get('/health', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const uptime = process.uptime();
  const tickets = storage.getTickets();
  const users = storage.getUsers();

  res.json({
    status: 'online',
    service: 'PTA-District-CVAS-CMS',
    osPlatform: `${os.type()} ${os.release()} (${os.arch()})`,
    hostname: os.hostname(),
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(uptime),
    memoryUsageMb: Math.round((mem.rss / (1024 * 1024)) * 10) / 10,
    heapUsedMb: Math.round((mem.heapUsed / (1024 * 1024)) * 10) / 10,
    activeConnections,
    totalTickets: tickets.length,
    activeUsers: users.length,
    storageEngine: storage.getStorageDiagnostics(),
    radiusEngine: radiusService.getTelemetry(),
    serverTime: new Date().toISOString()
  });
});

// Prometheus & JSON Metrics Endpoint for Grafana Dashboards
apiRouter.get('/metrics', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const cpus = os.cpus();
  const sorted = [...latencyWindowMs].sort((a, b) => a - b);
  const p = (pct: number) => (sorted.length > 0 ? sorted[Math.min(sorted.length - 1, Math.floor((pct / 100) * sorted.length))] : 0);
  const avg = sorted.length > 0 ? Math.round((sorted.reduce((a, b) => a + b, 0) / sorted.length) * 100) / 100 : 0;
  const radiusStats = radiusService.getTelemetry();
  const dbDiag = storage.getStorageDiagnostics();

  if (req.query.format === 'json') {
    return res.json({
      activeConnections,
      totalHttpRequests,
      totalHttpErrors,
      statusCounts,
      latencyMs: {
        avg,
        p50: p(50),
        p90: p(90),
        p95: p(95),
        p99: p(99),
        samples: sorted.length,
      },
      resources: {
        cpuCount: cpus.length,
        loadAvg1m: os.loadavg()[0],
        rssMb: Math.round((mem.rss / 1048576) * 10) / 10,
        heapUsedMb: Math.round((mem.heapUsed / 1048576) * 10) / 10,
        freeSystemMemMb: Math.round(os.freemem() / 1048576),
        totalSystemMemMb: Math.round(os.totalmem() / 1048576),
      },
      database: dbDiag,
      radius: radiusStats,
    });
  }

  const promLines = [
    '# HELP citrus_active_connections Currently active HTTP requests',
    '# TYPE citrus_active_connections gauge',
    `citrus_active_connections ${activeConnections}`,
    '# HELP citrus_http_requests_total Total HTTP API requests processed',
    '# TYPE citrus_http_requests_total counter',
    `citrus_http_requests_total ${totalHttpRequests}`,
    '# HELP citrus_http_errors_total Total HTTP 4xx/5xx responses',
    '# TYPE citrus_http_errors_total counter',
    `citrus_http_errors_total ${totalHttpErrors}`,
    '# HELP citrus_http_latency_ms Response time percentiles in milliseconds',
    '# TYPE citrus_http_latency_ms gauge',
    `citrus_http_latency_ms{quantile="avg"} ${avg}`,
    `citrus_http_latency_ms{quantile="0.50"} ${p(50)}`,
    `citrus_http_latency_ms{quantile="0.90"} ${p(90)}`,
    `citrus_http_latency_ms{quantile="0.95"} ${p(95)}`,
    `citrus_http_latency_ms{quantile="0.99"} ${p(99)}`,
    '# HELP citrus_memory_rss_bytes Resident memory size in bytes',
    '# TYPE citrus_memory_rss_bytes gauge',
    `citrus_memory_rss_bytes ${mem.rss}`,
    '# HELP citrus_db_indexed_tickets Total indexed complaints in memory',
    '# TYPE citrus_db_indexed_tickets gauge',
    `citrus_db_indexed_tickets ${dbDiag.indexedTickets}`,
    '# HELP citrus_radius_circuit_open 1 if ZalPro circuit breaker is OPEN, 0 if CLOSED',
    '# TYPE citrus_radius_circuit_open gauge',
    `citrus_radius_circuit_open ${radiusStats.circuitState === 'OPEN' ? 1 : 0}`,
  ];
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(promLines.join('\n') + '\n');
});

// Authentication endpoint with Brute-Force Protection
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body || {};
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const rateKey = `${clientIp}:${String(identifier || '').toLowerCase()}`;
  const now = Date.now();

  const record = loginAttempts.get(rateKey);
  if (record && record.resetAt > now && record.count >= 10) {
    return res.status(429).json({
      error: 'Too many failed login attempts. Account/IP temporarily locked for 60 seconds.',
      retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
    });
  }

  if (!identifier || !password || typeof identifier !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Identifier and password are required' });
  }

  const user =
    storage.getUserByEmail(identifier.trim()) ||
    storage.getUserByCircuitId(identifier.trim()) ||
    storage.getUserById(identifier.trim());

  if (!user || user.password !== password) {
    const current = loginAttempts.get(rateKey);
    if (!current || current.resetAt <= now) {
      loginAttempts.set(rateKey, { count: 1, resetAt: now + 60_000 });
    } else {
      current.count++;
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  loginAttempts.delete(rateKey);
  const { password: _omitted, ...safeUser } = user;
  return res.json({
    authenticated: true,
    user: safeUser,
    sessionToken: `sess-${crypto.randomBytes(16).toString('hex')}`,
  });
});

// ZalPro / RADIUS AAA Integration Endpoints
apiRouter.get('/radius/subscriber/:identifier', async (req: Request, res: Response) => {
  const identifier = req.params.identifier;
  const simulateDelayMs = req.query.simulateDelayMs ? parseInt(req.query.simulateDelayMs as string, 10) : undefined;
  const simulateFault = req.query.simulateFault as any;
  const bypassCache = req.query.bypassCache === 'true';
  const effectiveTimeoutMs = req.query.timeoutMs ? parseInt(req.query.timeoutMs as string, 10) : undefined;

  try {
    const result = await radiusService.lookupSubscriber(identifier, {
      simulateDelayMs,
      simulateFault,
      bypassCache,
      effectiveTimeoutMs,
    });
    res.json(result);
  } catch (err: any) {
    res.status(503).json({
      error: 'ZalPro RADIUS service temporarily unavailable',
      degraded: true,
    });
  }
});

apiRouter.get('/radius/health', (_req: Request, res: Response) => {
  res.json(radiusService.getTelemetry());
});

apiRouter.post('/radius/reset-circuit', (_req: Request, res: Response) => {
  radiusService.resetCircuitBreaker();
  res.json({ status: 'reset', telemetry: radiusService.getTelemetry() });
});

// Hardened File / Screenshot Evidence Upload Endpoint
apiRouter.post('/uploads/evidence', async (req: Request, res: Response) => {
  try {
    const { filename, mimeType, base64Data, sizeBytes, interrupted } = req.body || {};

    if (interrupted === true) {
      return res.status(400).json({ error: 'Upload stream interrupted before completion (ECONNRESET / Incomplete payload)' });
    }

    if (!filename || !mimeType || !base64Data || typeof base64Data !== 'string') {
      return res.status(400).json({ error: 'filename, mimeType, and base64Data are required' });
    }

    // 1. Validate file extension & MIME allowlist (strictly images only)
    const allowedMimes = ['image/png', 'image/jpeg', 'image/webp'];
    const ext = path.extname(String(filename)).toLowerCase();
    const allowedExts = ['.png', '.jpg', '.jpeg', '.webp'];

    if (!allowedMimes.includes(mimeType) || !allowedExts.includes(ext)) {
      return res.status(415).json({
        error: `Unsupported file type (${mimeType} / ${ext}). Only PNG, JPEG, and WEBP screenshots are permitted.`,
      });
    }

    // Strip Data URL prefix if present
    const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Buffer.from(rawBase64, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Empty or corrupted file payload' });
    }

    const effectiveSize = typeof sizeBytes === 'number' ? Math.max(buffer.length, sizeBytes) : buffer.length;
    if (effectiveSize > MAX_UPLOAD_BYTES) {
      return res.status(413).json({
        error: `File size (${Math.round((effectiveSize / 1048576) * 100) / 100} MB) exceeds the 5.00 MB maximum limit`,
      });
    }

    // 2. Verify binary Magic Bytes to block disguised scripts/executables (e.g. .php/.exe renamed to .png)
    const isPng = buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isWebp =
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';

    if (!isPng && !isJpeg && !isWebp) {
      return res.status(415).json({
        error: 'File binary signature (magic bytes) does not match a valid PNG, JPEG, or WEBP image. Upload rejected.',
      });
    }

    // 3. SHA-256 Deduplication
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const existingUpload = uploadHashRegistry.get(sha256);
    if (existingUpload) {
      res.setHeader('X-Duplicate-Upload', 'true');
      return res.status(200).json({
        ...existingUpload,
        deduplicated: true,
        sha256,
      });
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
      await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    }

    const fileId = `evd-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const safeFilename = `${fileId}${ext}`;
    const targetPath = path.join(UPLOADS_DIR, safeFilename);

    // Write with 0o600 permissions (read/write owner only, never executable)
    await fs.promises.writeFile(targetPath, buffer, { mode: 0o600 });

    const meta = {
      fileId,
      filename: safeFilename,
      sizeBytes: buffer.length,
      createdAt: new Date().toISOString(),
    };
    uploadHashRegistry.set(sha256, meta);

    return res.status(201).json({
      ...meta,
      deduplicated: false,
      sha256,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Upload processing failed' });
  }
});

// Config
apiRouter.get('/config', (_req: Request, res: Response) => {
  res.json(storage.getConfig());
});

apiRouter.put('/config', (req: Request, res: Response) => {
  const updated = storage.updateConfig(req.body);
  res.json(updated);
});

// Users
apiRouter.get('/users', (req: Request, res: Response) => {
  const role = req.query.role as string;
  let users = storage.getUsers();
  if (role) {
    users = users.filter(u => u.role === role);
  }
  res.json(users);
});

apiRouter.get('/users/:id', (req: Request, res: Response) => {
  const user =
    storage.getUserById(req.params.id) ||
    storage.getUserByCircuitId(req.params.id) ||
    storage.getUserByEmail(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Subscriber not found' });
  }
  const { password: _omitted, ...safeUser } = user;
  res.json(safeUser);
});

apiRouter.post('/users', (req: Request, res: Response) => {
  const { name, email, phone, cnic, role, circuitId, district, areaAddress, connectionType, bandwidthPlan, password, status } = req.body;
  
  if (!name || !email || !phone || !cnic) {
    return res.status(400).json({ error: 'Name, email, phone, and CNIC are required' });
  }

  const cleanEmail = String(email).trim();
  const existingUser = storage.getUserByEmail(cleanEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'A user with this email is already registered' });
  }

  const config = storage.getConfig();
  const cktPrefix = (config.circuitPrefix || `PK-${(district || config.registeredDistrict || 'SGD').substring(0, 3).toUpperCase()}`).trim().toUpperCase();

  const newUser = storage.createUser({
    name: sanitizeText(name, 100),
    email: cleanEmail,
    phone: sanitizeText(phone, 30),
    cnic: sanitizeText(cnic, 25),
    role: role || 'customer',
    password: password || 'citrus123',
    circuitId: circuitId || (role === 'customer' ? `${cktPrefix}-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
    district: district || config.registeredDistrict || 'Sargodha',
    areaAddress: areaAddress ? sanitizeText(areaAddress, 250) : undefined,
    connectionType: connectionType || 'FTTH',
    bandwidthPlan: bandwidthPlan || (config.bandwidthPlans?.[0] || '30 Mbps Standard Fiber'),
    status: status || 'active'
  });

  res.status(201).json(newUser);
});

apiRouter.put('/users/:id', (req: Request, res: Response) => {
  try {
    const updated = storage.updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/users/:id', (req: Request, res: Response) => {
  try {
    storage.deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Tickets (O(1) Indexed Customer Lookup + Fast Filtering)
apiRouter.get('/complaints', (req: Request, res: Response) => {
  const { district, status, priority, category, search, customerId, limit } = req.query;

  // Use O(1) secondary index when querying by customerId
  let tickets = customerId
    ? storage.getTicketsByCustomerId(customerId as string)
    : storage.getTickets();

  if (district) {
    const dLower = (district as string).toLowerCase();
    tickets = tickets.filter(t => t.district.toLowerCase() === dLower);
  }
  if (status) {
    tickets = tickets.filter(t => t.status === status);
  }
  if (priority) {
    tickets = tickets.filter(t => t.priority === priority);
  }
  if (category) {
    tickets = tickets.filter(t => t.category === category);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    tickets = tickets.filter(t => 
      t.ticketNumber.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q) ||
      t.circuitId.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.customerPhone.includes(q)
    );
  }
  const maxItems = limit === 'all' ? 0 : parseInt((limit as string) || '50', 10);
  if (!isNaN(maxItems) && maxItems > 0 && tickets.length > maxItems) {
    tickets = tickets.slice(0, maxItems);
  }

  res.json(tickets);
});

apiRouter.get('/complaints/:id', (req: Request, res: Response) => {
  const ticket = storage.getTicketById(req.params.id) || storage.getTicketByNumber(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  res.json(ticket);
});

apiRouter.post('/complaints', (req: Request, res: Response) => {
  const { customerId, category, priority, subject, description, opticalPowerRx, pingLatencyMs, packetLossPercent, idempotencyKey } = req.body || {};
  
  if (!customerId || !category || !priority || !subject || !description) {
    return res.status(400).json({ error: 'Missing required complaint fields (customerId, category, priority, subject, description)' });
  }

  const cleanSubject = sanitizeText(subject, 200);
  const cleanDescription = sanitizeText(description, 1500);
  if (!cleanSubject || !cleanDescription) {
    return res.status(400).json({ error: 'Complaint subject and description must contain valid text' });
  }

  const headerIdempotencyKey = (req.headers['x-idempotency-key'] as string) || idempotencyKey;

  try {
    const { ticket, deduplicated } = storage.createTicket({
      customerId: String(customerId),
      category,
      priority,
      subject: cleanSubject,
      description: cleanDescription,
      opticalPowerRx: opticalPowerRx ? sanitizeText(opticalPowerRx, 50) : undefined,
      pingLatencyMs: typeof pingLatencyMs === 'number' ? pingLatencyMs : undefined,
      packetLossPercent: typeof packetLossPercent === 'number' ? packetLossPercent : undefined,
      idempotencyKey: headerIdempotencyKey ? String(headerIdempotencyKey) : undefined,
    });

    if (deduplicated) {
      res.setHeader('X-Idempotent-Replay', 'true');
      return res.status(200).json(ticket);
    }

    res.status(201).json(ticket);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/complaints/:id', (req: Request, res: Response) => {
  try {
    const updated = storage.updateTicketStatus(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/complaints/:id/feedback', (req: Request, res: Response) => {
  const { rating, comments, isSatisfied } = req.body;
  if (rating === undefined || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const updated = storage.addCustomerFeedback(
      req.params.id,
      rating,
      sanitizeText(comments || '', 500),
      isSatisfied !== false
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// NOC Acknowledgment of Complaint
apiRouter.post('/complaints/:id/ack', (req: Request, res: Response) => {
  const { performedBy, notes } = req.body;
  try {
    const updated = storage.acknowledgeTicket(
      req.params.id,
      sanitizeText(performedBy || 'Hafiz Bilal Ahmed (NOC Supervisor)', 100),
      notes ? sanitizeText(notes, 500) : undefined
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// NOC Online Status Update for Customer Web Tracking
apiRouter.post('/complaints/:id/online-update', (req: Request, res: Response) => {
  const { updateText, performedBy, role } = req.body;
  if (!updateText) {
    return res.status(400).json({ error: 'updateText is required' });
  }
  try {
    const updated = storage.postOnlineUpdate(
      req.params.id,
      sanitizeText(updateText, 500),
      sanitizeText(performedBy || 'Citrus NOC Operations', 100),
      sanitizeText(role || 'NOC Support', 50)
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PTA Regulatory Reports
apiRouter.get('/reports/pta-monthly', (req: Request, res: Response) => {
  const monthQuery = (req.query.month as string) || 'October 2026';
  const districtQuery = (req.query.district as DistrictName) || storage.getConfig().registeredDistrict;
  
  const allTickets = storage.getTickets().filter(t => t.district.toLowerCase() === districtQuery.toLowerCase());
  const config = storage.getConfig();

  const totalReceived = allTickets.length;
  const resolvedTickets = allTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
  const totalResolved = resolvedTickets.length;
  const resolvedWithinSla = resolvedTickets.filter(t => !t.isSlaBreached).length;
  const resolvedBeyondSla = resolvedTickets.filter(t => t.isSlaBreached).length;
  const escalatedToPta = allTickets.filter(t => t.status === 'ESCALATED_PTA' || t.isSlaBreached).length;
  const currentlyPending = allTickets.filter(t => t.status === 'REGISTERED' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;

  const slaCompliancePercentage = totalResolved > 0 
    ? Math.round((resolvedWithinSla / totalResolved) * 1000) / 10 
    : 100;

  // Calculate Mean Time to Repair (MTTR in hours)
  const totalResolutionHours = resolvedTickets.reduce((acc, t) => acc + (t.resolutionTimeHours || 0), 0);
  const meanTimeToRepairHours = totalResolved > 0 
    ? Math.round((totalResolutionHours / totalResolved) * 10) / 10 
    : 0;

  // Customer satisfaction rate
  const ratedTickets = allTickets.filter(t => t.feedbackRating !== undefined);
  const satisfiedCount = ratedTickets.filter(t => (t.feedbackRating || 0) >= 4).length;
  const satisfactionRatePercentage = ratedTickets.length > 0 
    ? Math.round((satisfiedCount / ratedTickets.length) * 100) 
    : 95;

  const categories: ComplaintCategory[] = [
    'OFC_CUT',
    'SPEED_DEGRADATION',
    'FREQUENT_DISCONNECT',
    'DNS_ROUTING',
    'CPE_ONT_FAULT',
    'BILLING_PAYMENT',
    'NEW_PROVISIONING'
  ];

  const categoryStats = categories.map(cat => {
    const catTickets = allTickets.filter(t => t.category === cat);
    const resolvedCat = catTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    const withinSla = resolvedCat.filter(t => !t.isSlaBreached).length;
    const breached = catTickets.filter(t => t.isSlaBreached).length;
    const catHours = resolvedCat.reduce((acc, t) => acc + (t.resolutionTimeHours || 0), 0);
    const avgHours = resolvedCat.length > 0 ? Math.round((catHours / resolvedCat.length) * 10) / 10 : 0;

    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      total: catTickets.length,
      withinSla,
      breached,
      avgHours
    };
  });

  const report: PTAMonthlyReport = {
    periodMonth: monthQuery,
    district: districtQuery,
    totalReceived,
    totalResolved,
    resolvedWithinSla,
    resolvedBeyondSla,
    escalatedToPta,
    currentlyPending,
    slaCompliancePercentage,
    meanTimeToRepairHours,
    satisfactionRatePercentage,
    categoryStats,
    licensee: config,
    generatedAt: new Date().toISOString()
  };

  res.json(report);
});

// CSV Export for PTA Submission
apiRouter.get('/reports/export-csv', (_req: Request, res: Response) => {
  const tickets = storage.getTickets();
  const config = storage.getConfig();

  let csv = 'Ticket Number,District,Circuit ID,Customer Name,Phone,Category,Priority,Status,Created At,SLA Target Hours,Resolved At,MTTR Hours,SLA Breached,Root Cause,Corrective Action\n';

  tickets.forEach(t => {
    const targetHours = t.priority === 'P1_CRITICAL' ? 8 : t.priority === 'P2_MAJOR' ? 24 : 48;
    csv += `"${t.ticketNumber}","${t.district}","${t.circuitId}","${t.customerName}","${t.customerPhone}","${t.category}","${t.priority}","${t.status}","${t.createdAt}","${targetHours}","${t.resolvedAt || ''}","${t.resolutionTimeHours || ''}","${t.isSlaBreached ? 'YES' : 'NO'}","${(t.rootCauseCategory || '').replace(/"/g, '""')}","${(t.correctiveAction || '').replace(/"/g, '""')}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=PTA_CVAS_${config.registeredDistrict}_Complaints_${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(csv);
});

// Reset database
apiRouter.post('/system/reset', (_req: Request, res: Response) => {
  storage.resetToSampleData();
  res.json({ message: 'Database reset to sample state successfully' });
});
