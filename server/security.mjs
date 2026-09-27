const hosts = new Set(['127.0.0.1:8787', 'localhost:8787', '127.0.0.1:5173', 'localhost:5173', '127.0.0.1:4173', 'localhost:4173']);
const origins = new Set([...hosts].map(host => `http://${host}`));
export function authorizeRequest(method, headers, token) {
  if (!hosts.has(headers.host)) throw new Error('Untrusted Host. Use localhost.');
  if (headers.origin && !origins.has(headers.origin)) throw new Error('Untrusted Origin.');
  if (headers['sec-fetch-site'] === 'cross-site') throw new Error('Cross-site requests are rejected.');
  if (method !== 'GET') {
    if (headers['content-type']?.split(';')[0] !== 'application/json' || headers['x-clearline-token'] !== token) throw new Error('Local session token and JSON request required.');
  }
}
