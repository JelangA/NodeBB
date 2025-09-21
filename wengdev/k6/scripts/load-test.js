import http from 'k6/http';
import { sleep } from 'k6';
import { expect } from "https://jslib.k6.io/k6-testing/0.5.0/index.js";

export const options = {
  vus: 100,
  duration: '30s',
};
const Alpine_host = "172.26.80.1:4567"
const Windows_host = "localhost:4567"
export default function() {
  let res = http.get(`http://${host}/api/v3/categories`);
  expect.soft(res.status).toBe(200);
  sleep(1);
}
