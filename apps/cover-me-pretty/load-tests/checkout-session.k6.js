/**
 * Load test for checkout-session route.
 * Usage:
 *   API_BASE_URL=http://localhost:3000 k6 run checkout-session.k6.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import encoding from 'k6/encoding';
import { hmac } from 'k6/crypto';

const sku = {
  id: 'green-sneaker',
  title: 'Eco Runner — Green',
  price: 119,
  deposit: 50,
};

function encodeCartCookie(cart) {
  const secret = __ENV.CART_COOKIE_SECRET || 'dev-cart-secret';
  const encoded = encoding.b64encode(JSON.stringify(cart), 'url');
  const sig = hmac('sha256', secret, encoded, 'hex');
  return `${encoded}.${sig}`;
}

const cart = {
  [`${sku.id}:40`]: { sku, qty: 1, size: '40' },
};

const CART_COOKIE = '__Host-CART_ID';
const cartCookie = encodeCartCookie(cart);

export const options = {
  scenarios: {
    checkout: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function checkoutSessionLoadTest() {
  const res = http.post(
    `${__ENV.API_BASE_URL}/api/checkout-session`,
    JSON.stringify({ currency: 'EUR', taxRegion: 'EU' }),
    {
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${CART_COOKIE}=${cartCookie}`,
      },
    }
  );

  check(res, {
    'status 200': (r) => r.status === 200,
  });

  sleep(1);
}
