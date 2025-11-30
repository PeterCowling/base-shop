/**
 * Load test for rental and return routes.
 *
 * Environment variables:
 *   SHOP_BASE_URL - base URL of the shop service (e.g., http://localhost:3004)
 *
 * Session IDs follow the pattern `vu-<VU>-iter-<ITER>`, for example `vu-1-iter-0`.
 *
 * Usage:
 *   SHOP_BASE_URL=http://localhost:3004 k6 run rental-return.k6.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    rentalReturn: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function rentalReturnLoadTest() {
  const base = __ENV.SHOP_BASE_URL;
  const sessionId = `vu-${__VU}-iter-${__ITER}`;
  const params = { headers: { 'Content-Type': 'application/json' } };

  const rentalRes = http.post(`${base}/api/rental`, JSON.stringify({ sessionId }), params);
  check(rentalRes, {
    'rental status 200': (r) => r.status === 200,
  });

  const patchRes = http.patch(`${base}/api/rental`, JSON.stringify({ sessionId }), params);
  check(patchRes, {
    'patch status 200': (r) => r.status === 200,
  });

  const returnRes = http.post(`${base}/api/return`, JSON.stringify({ sessionId }), params);
  check(returnRes, {
    'return status 200': (r) => r.status === 200,
  });

  sleep(1);
}
