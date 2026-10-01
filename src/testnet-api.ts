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
