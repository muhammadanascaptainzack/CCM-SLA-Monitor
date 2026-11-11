/**
 * Grafana k6 Load, Stress, Spike & 24-Hour Endurance Test Suite
 * Target: Citrus ISP Customer Complaint Management Portal
 *
 * Execution Commands (Run from a separate Load Generator VM, NOT the production host):
 *   1. Progressive Load & Stress Test (100 -> 2,000 VUs):
 *      k6 run --env BASE_URL=http://<SERVER_IP>:4000 tests/k6-isp-load-test.js
 *
 *   2. Spike Test (100 -> 1,000 in 10s, 1,000 -> 1,500 in 5s, 1,500 -> 100):
 *      k6 run --env MODE=spike --env BASE_URL=http://<SERVER_IP>:4000 tests/k6-isp-load-test.js
 *
 *   3. 24-Hour Endurance / Soak Test (1,000 sustained VUs for 24h):
 *      k6 run --env MODE=endurance --env BASE_URL=http://<SERVER_IP>:4000 tests/k6-isp-load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('http_error_rate');
const complaintSubmitTrend = new Trend('complaint_submit_duration_ms');
const radiusLookupTrend = new Trend('radius_lookup_duration_ms');

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:4000';
const MODE = __ENV.MODE || 'progressive';

const PROGRESSIVE_STAGES = [
  { duration: '1m', target: 100 },
  { duration: '2m', target: 250 },
  { duration: '2m', target: 500 },
  { duration: '2m', target: 750 },
  { duration: '3m', target: 1000 },
  { duration: '2m', target: 1250 },
  { duration: '2m', target: 1500 },
  { duration: '2m', target: 2000 },
  { duration: '1m', target: 100 }, // Recovery verification stage
  { duration: '30s', target: 0 },
];

const SPIKE_STAGES = [
  { duration: '30s', target: 100 },
  { duration: '10s', target: 1000 }, // Scenario A: 100 -> 1,000 in 10s
  { duration: '1m', target: 1000 },
  { duration: '5s', target: 1500 },  // Scenario B: 1,000 -> 1,500 in 5s
  { duration: '1m', target: 1500 },
  { duration: '10s', target: 100 },  // Scenario C: 1,500 -> 100 sudden drop
  { duration: '1m', target: 100 },
  { duration: '15s', target: 0 },
];

const ENDURANCE_STAGES = [
  { duration: '5m', target: 1000 },
  { duration: '24h', target: 1000 }, // 24-hour soak at 1,000 concurrent users
  { duration: '5m', target: 0 },
];

export const options = {
  stages:
    MODE === 'spike'
      ? SPIKE_STAGES
      : MODE === 'endurance'
      ? ENDURANCE_STAGES
      : PROGRESSIVE_STAGES,
  thresholds: {
    http_req_duration: ['avg<500', 'p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.01'],
    http_error_rate: ['rate<0.01'],
  },
};

// Minimal valid 1x1 PNG base64 for screenshot evidence upload testing
const SAMPLE_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export default function () {
  const customers = ['usr-1', 'usr-2', 'usr-3'];
  const customerId = customers[__VU % customers.length];

  group('1. Open Portal & Fetch Config', () => {
    const res = http.get(`${BASE_URL}/api/config`);
    const ok = check(res, { 'config status 200': (r) => r.status === 200 });
    errorRate.add(!ok);
  });

  group('2. Check Customer Profile & ZalPro RADIUS Status/Package/Balance', () => {
    const t0 = Date.now();
    const res = http.get(`${BASE_URL}/api/radius/subscriber/${customerId}`);
    radiusLookupTrend.add(Date.now() - t0);
    const ok = check(res, {
      'radius status 200': (r) => r.status === 200,
      'has connectionStatus & balance': (r) => {
        const body = r.json();
        return body && body.record && typeof body.record.currentBalancePkr === 'number';
      },
    });
    errorRate.add(!ok);
  });

  group('3. Check Customer Complaint History & Status', () => {
    const res = http.get(`${BASE_URL}/api/complaints?customerId=${customerId}`);
    const ok = check(res, { 'history status 200': (r) => r.status === 200 });
    errorRate.add(!ok);
  });

  // 15% of active iterations submit a new complaint + screenshot evidence
  if (__ITER % 7 === 0) {
    group('4. Submit New Complaint with Idempotency Key', () => {
      const idempKey = `k6-${__VU}-${__ITER}-${Date.now()}`;
      const payload = JSON.stringify({
        customerId,
        category: 'SPEED_DEGRADATION',
        priority: 'P2_MAJOR',
        subject: `Slow browsing speed reported by VU ${__VU}`,
        description: `Automated k6 load test complaint iteration ${__ITER}`,
        idempotencyKey: idempKey,
      });
      const t0 = Date.now();
      const res = http.post(`${BASE_URL}/api/complaints`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempKey,
        },
      });
      complaintSubmitTrend.add(Date.now() - t0);
      const ok = check(res, {
        'complaint created 201 or 200': (r) => r.status === 201 || r.status === 200,
      });
      errorRate.add(!ok);
    });

    group('5. Upload Complaint Screenshot Evidence', () => {
      const uploadPayload = JSON.stringify({
        filename: `los-router-vu${__VU}.png`,
        mimeType: 'image/png',
        base64Data: SAMPLE_PNG_B64,
      });
      const res = http.post(`${BASE_URL}/api/uploads/evidence`, uploadPayload, {
        headers: { 'Content-Type': 'application/json' },
      });
      const ok = check(res, {
        'upload 201 or 200 deduplicated': (r) => r.status === 201 || r.status === 200,
      });
      errorRate.add(!ok);
    });
  }

  // Realistic subscriber think-time (3 to 6 seconds between portal actions)
  sleep(3 + Math.random() * 3);
}
