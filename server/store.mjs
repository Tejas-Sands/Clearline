import { mkdirSync, readFileSync, existsSync, writeFileSync, renameSync, openSync, fsyncSync, closeSync } from 'node:fs';
import { join } from 'node:path';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export function atomicWrite(path, value) {
  const temp = `${path}.tmp`;
  writeFileSync(temp, JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v), { mode: 0o600 });
  const fd = openSync(temp, 'r');
  try { fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temp, path);
}
export function openStore(dir) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const walletPath = join(dir, 'wallet.json');
  if (!existsSync(walletPath)) writeFileSync(walletPath, JSON.stringify({ privateKey: generatePrivateKey(), recipientKey: generatePrivateKey() }), { mode: 0o600, flag: 'wx' });
  const keys = JSON.parse(readFileSync(walletPath, 'utf8'));
  const account = privateKeyToAccount(keys.privateKey);
  const recipient = privateKeyToAccount(keys.recipientKey).address;
  const path = join(dir, 'payments.json');
  const state = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { version: 1, sender: account.address, payments: [] };
  if (state.version !== 1 || state.sender !== account.address || !Array.isArray(state.payments)) throw new Error('Testnet records do not match the wallet. Restore their backup; do not delete them to retry.');
  return { state, account, privateKey: keys.privateKey, recipient, save: () => atomicWrite(path, state) };
}
