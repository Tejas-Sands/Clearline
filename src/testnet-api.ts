export function friendlyTestnetError(message: string): string {
  if (/No route available|Route or resource not found/i.test(message)) {
    return 'Circle could not find an available USDC → EURC testnet route. Request a quote again shortly, or create a separate payment with a smaller amount. Wallet balances alone do not guarantee a swap route.';
  }
  if (/slippage|stop limit/i.test(message)) {
    return 'Circle could not prepare a swap within the minimum EURC output. Check the payment status and any transaction receipts before requesting a fresh quote. The app has not increased your slippage limit.';
  }
  return message;
}

export async function readTestnetResponse<T>(response: Response): Promise<T> {
  const fallback = `Testnet API returned HTTP ${response.status}. Check the payment's latest status before trying again.`;
  let data;
  try { data = await response.json(); }
  catch {
    throw new Error(response.ok ? 'The testnet API returned an unreadable response. Reload the page and check the payment status.' : fallback);
  }
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : fallback);
  return data as T;
}
