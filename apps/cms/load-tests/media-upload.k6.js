/**
 * Load test for CMS media upload.
 * Usage:
 *   CMS_BASE_URL=http://localhost:8789 k6 run media-upload.k6.js
 */
import { check, sleep } from 'k6';
import encoding from 'k6/encoding';
import http from 'k6/http';

export const options = {
  scenarios: {
    upload: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

const imgBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

export default function mediaUploadScenario() {
  const bin = encoding.b64decode(imgBase64, 'binary');
  const data = { file: http.file(bin, 'pixel.png', 'image/png') };
  const res = http.post(`${__ENV.CMS_BASE_URL}/cms/api/media?shop=test`, data);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
