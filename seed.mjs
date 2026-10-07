// seed.mjs  ->  node seed.mjs
const BASE = 'http://localhost:3000/api/v1';
const TOTAL = 200;

for (let i = 1; i <= TOTAL; i++) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Test User ${i}`,
      email: `loadtest${i}@test.com`,
      password: 'Password123!',
    }),
  });
  if (!res.ok) console.log(i, res.status, await res.text());
}
console.log('listo');
