import test from 'node:test';
import assert from 'node:assert/strict';

test('route errors offer quote recovery instead of a raw provider exception', async () => {
  const { friendlyTestnetError } = await import('../src/testnet-api.ts');
  const message = friendlyTestnetError('Stablecoin Service createSwap failed: Route or resource not found. Details: No route available');
  assert.match(message, /testnet.*route/i);
  assert.match(message, /quote.*again/i);
  assert.doesNotMatch(message, /createSwap|private key|not moved/i);
});

test('slippage guidance does not claim funds were untouched without receipt evidence', async () => {
  const { friendlyTestnetError } = await import('../src/testnet-api.ts');
  const message = friendlyTestnetError('Unable to calculate slippage for the requested stop limit');
  assert.match(message, /minimum.*EURC/i);
  assert.match(message, /status/i);
  assert.doesNotMatch(message, /not moved|pool moved/i);
});

test('plain-text server failures show HTTP status instead of a JSON parsing error', async () => {
  const { readTestnetResponse } = await import('../src/testnet-api.ts');
  await assert.rejects(readTestnetResponse(new Response('A server error has occurred', { status: 500 })), error => {
    assert.match(error.message, /500/);
    assert.doesNotMatch(error.message, /Unexpected token|not valid JSON|A server error/);
    return true;
  });
});

test('API validation errors keep their useful message', async () => {
  const { readTestnetResponse } = await import('../src/testnet-api.ts');
  await assert.rejects(readTestnetResponse(Response.json({ error: 'Invoice reference already exists.' }, { status: 400 })), /Invoice reference already exists/);
});

test('successful API responses preserve payment data', async () => {
  const { readTestnetResponse } = await import('../src/testnet-api.ts');
  assert.deepEqual(await readTestnetResponse(Response.json({ accepted: true })), { accepted: true });
});

test('a successful HTTP response containing HTML reports an unreadable API response', async () => {
  const { readTestnetResponse } = await import('../src/testnet-api.ts');
  await assert.rejects(readTestnetResponse(new Response('<html>Oops</html>')), /unreadable response/i);
});

test('deployed payment action returns JSON for a rejected method without loading credentials', async () => {
  const { default: handler } = await import('../api/testnet/payments/action.mjs');
  let status;
  let body;
  const res = { setHeader() {}, status(code) { status = code; return this; }, json(value) { body = value; } };
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(status, 405);
  assert.deepEqual(body, { error: 'Method not allowed.' });
});

test('deployed payment action rejects unauthenticated mutations before accessing the database', async () => {
  const { default: handler } = await import('../api/testnet/payments/action.mjs');
  let status;
  let body;
  const res = { setHeader() {}, status(code) { status = code; return this; }, json(value) { body = value; } };
  await handler({ method: 'POST', url: '/api/testnet/payments/abc-123/quote', headers: { host: 'localhost' } }, res);
  assert.equal(status, 400);
  assert.deepEqual(body, { error: 'JSON request required.' });
});
