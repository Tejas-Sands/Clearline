import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeRequest } from '../server/security.mjs';
const valid = { host: '127.0.0.1:8787', origin: 'http://127.0.0.1:5173', 'content-type': 'application/json', 'x-clearline-token': 'session-token' };
test('local signer rejects foreign origins, DNS rebinding hosts and missing mutation tokens', () => {
  assert.doesNotThrow(() => authorizeRequest('POST', valid, 'session-token'));
  for (const change of [{ origin: 'https://evil.example' }, { host: 'evil.example:8787' }, { 'x-clearline-token': '' }, { 'content-type': 'text/plain' }, { 'sec-fetch-site': 'cross-site' }]) assert.throws(() => authorizeRequest('POST', { ...valid, ...change }, 'session-token'));
  assert.throws(() => authorizeRequest('GET', { ...valid, origin: 'https://evil.example' }, 'session-token'));
  assert.doesNotThrow(() => authorizeRequest('GET', { host: '127.0.0.1:8787' }, 'session-token'));
});
