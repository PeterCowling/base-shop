/**
 * Load test for orders routes.
 * Usage:
 *   API_BASE_URL=http://localhost:3000 CUSTOMER_SESSION=<token> k6 run orders.k6.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const session = __ENV.CUSTOMER_SESSION || '';

export const options = {
  scenarios: {
    orders: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function ordersLoadTest() {
  const base = __ENV.API_BASE_URL;
  const params = {
    headers: {
      Cookie: `customer_session=${session}`,
    },
  };

  const res = http.get(`${base}/api/orders`, params);
  check(res, {
    'orders status 200': (r) => r.status === 200,
  });

  try {
    const data = res.json();
    if (data?.orders?.length) {
      const id = data.orders[0].id;
      const trackRes = http.get(`${base}/api/orders/${id}/tracking`, params);
      check(trackRes, {
        'tracking status ok or 404': (r) => r.status === 200 || r.status === 404,
      });
    }
  } catch {
    // ignore JSON parse errors
  }

  sleep(1);
}
