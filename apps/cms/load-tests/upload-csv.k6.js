/**
 * Load test for uploading CSV product data to the CMS.
 * Usage:
 *   CMS_BASE_URL=http://localhost:8789 k6 run upload-csv.k6.js
 */
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  scenarios: {
    upload: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

function generateCsv(sizeBytes) {
  const header = 'id,name,price\n';
  const row = '1,Sample Product,9.99\n';
  let data = header;
  while (data.length < sizeBytes) {
    data += row;
  }
  return data.slice(0, sizeBytes);
}

const csvContent = generateCsv(5 * 1024 * 1024);

export default function uploadCsvScenario() {
  const url = `${__ENV.CMS_BASE_URL}/cms/api/upload-csv/test-shop`;
  const payload = { file: http.file(csvContent, 'products.csv', 'text/csv') };
  const res = http.post(url, payload);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
