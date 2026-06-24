import { get, put } from '@vercel/blob';
import type { VercelRequest } from '@vercel/node';

export function checkAdminPassword(req: VercelRequest): boolean {
  const header = req.headers['x-admin-password'];
  const password = Array.isArray(header) ? header[0] : header;
  const expected = process.env.ADMIN_PASSWORD || '450521';
  return password === expected;
}

function hasBlobToken(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function readJson<T>(pathname: string): Promise<T[]> {
  if (!hasBlobToken()) return [];

  const result = await get(pathname, { access: 'private' });
  if (!result) return [];

  const text = await new Response(result.stream as BodyInit).text();
  if (!text) return [];
  return JSON.parse(text) as T[];
}

async function writeJson<T>(pathname: string, data: T[]): Promise<void> {
  if (!hasBlobToken()) return;

  await put(pathname, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

export const WALLET_PATH = 'cpbox-data/wallets.json';
export const RECORD_PATH = 'cpbox-data/records.json';

export async function loadWallets<T>(): Promise<T[]> {
  return readJson<T>(WALLET_PATH);
}

export async function saveWallet<T extends { address: string }>(
  record: T,
): Promise<void> {
  const items = await loadWallets<T>();
  const index = items.findIndex((w) => w.address === record.address);
  if (index >= 0) items[index] = record;
  else items.unshift(record);
  await writeJson(WALLET_PATH, items.slice(0, 500));
}

export async function loadRecords<T>(): Promise<T[]> {
  return readJson<T>(RECORD_PATH);
}

export async function saveRecord<T>(record: T): Promise<void> {
  const items = await loadRecords<T>();
  items.unshift(record);
  await writeJson(RECORD_PATH, items.slice(0, 500));
}

export function storageReady(): boolean {
  return hasBlobToken();
}
