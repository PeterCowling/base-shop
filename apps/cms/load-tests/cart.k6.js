/**
 * Load test for cart API.
 * Usage:
 *   API_BASE_URL=http://localhost:8788 k6 run cart.k6.js
 */
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  scenarios: {
    cart: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function cartScenario() {
  const baseUrl = __ENV.API_BASE_URL;
  const params = { headers: { 'Content-Type': 'application/json' } };

  const getRes = http.get(`${baseUrl}/api/cart`);
  check(getRes, {
    'GET status 200': (r) => r.status === 200,
  });

  const postPayload = JSON.stringify({
    sku: { id: 'green-sneaker' },
    qty: 1,
    size: '42',
  });
  const postRes = http.post(`${baseUrl}/api/cart`, postPayload, params);
  check(postRes, {
    'POST status 200': (r) => r.status === 200,
  });

  const cart = postRes.json('cart') || {};
  const itemId = Object.keys(cart)[0];

  if (itemId) {
    const patchPayload = JSON.stringify({ id: itemId, qty: 2 });
    const patchRes = http.patch(`${baseUrl}/api/cart`, patchPayload, params);
    check(patchRes, {
      'PATCH status 200': (r) => r.status === 200,
    });

    const deletePayload = JSON.stringify({ id: itemId });
    const deleteRes = http.del(`${baseUrl}/api/cart`, deletePayload, params);
    check(deleteRes, {
      'DELETE status 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
