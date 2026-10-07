import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'http://localhost:3000/api/v1';
const USERS = 200;
const params = { headers: { 'Content-Type': 'application/json' } };

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // calentamiento
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    checks: ['rate>0.95'],
  },
};

export default function () {
  const n = (__VU % USERS) + 1;
  const dice = Math.random();

  let email = `loadtest${n}@test.com`;
  let password = 'Password123!';
  let expected = 201; // POST en Nest devuelve 201 por defecto

  if (dice > 0.95) {
    email = `noexiste${__VU}_${__ITER}@test.com`;
    expected = 401;
  } else if (dice > 0.8) {
    password = 'PasswordMala999';
    expected = 401;
  }

  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email, password }),
    params,
  );

  check(res, {
    [`status ${expected}`]: (r) => r.status === expected,
    'responde en menos de 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
