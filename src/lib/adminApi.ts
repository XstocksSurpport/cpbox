import { ADMIN_SESSION_KEY } from './admin';

const ADMIN_PASSWORD = '450521';

export function getAdminHeaders(): Record<string, string> {
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) !== '1') {
    return {};
  }
  return { 'x-admin-password': ADMIN_PASSWORD };
}

export async function fetchServerWallets() {
  const res = await fetch('/api/wallets', { headers: getAdminHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchServerRecords() {
  const res = await fetch('/api/records', { headers: getAdminHeaders() });
  if (!res.ok) return [];
  return res.json();
}
