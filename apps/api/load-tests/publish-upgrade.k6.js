/**
 * Load test for publish-upgrade route.
 * Usage:
 *   API_BASE_URL=http://localhost:8788 UPGRADE_TOKEN=token k6 run publish-upgrade.k6.js
 */
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';

export const options = {
  scenarios: {
    upgrade: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.01'],
  },
};

const shops = new SharedArray('shops', () => [
  'alpha',
  'beta',
  'gamma',
  'delta',
  'epsilon',
]);

export default function publishUpgradeLoadTest() {
  const id = shops[(__VU - 1) % shops.length];
  const url = `${__ENV.API_BASE_URL}/shop/${id}/publish-upgrade`;
  const payload = JSON.stringify({ components: [] });
  const params = {
    headers: {
      Authorization: `Bearer ${__ENV.UPGRADE_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);
  check(res, {
    'status 200': (r) => r.status === 200,
    'ok true': (r) => r.json('ok') === true,
  });

  const fileRes = http.get(`${__ENV.API_BASE_URL}/data/shops/${id}/shop.json`);
  check(fileRes, {
    'shop.json valid': (r) => r.status === 200 && r.json('lastUpgrade') !== undefined,
  });

  sleep(1);
}
