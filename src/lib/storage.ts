export interface OperationRecord {
  id: string;
  type: 'opensource' | 'authority' | 'other';
  wallet: string;
  mintAddress: string;
  tokenName: string;
  action: string;
  signature?: string;
  timestamp: number;
}

export interface WalletRecord {
  id: string;
  address: string;
  privateKey: string;
  timestamp: number;
}

const RECORDS_KEY = 'cpbox_operation_records';
const WALLETS_KEY = 'cpbox_wallet_records';
const RPC_KEY = 'cpbox_rpc_endpoint';

export function getOperationRecords(): OperationRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? (JSON.parse(raw) as OperationRecord[]) : [];
  } catch {
    return [];
  }
}

export function addOperationRecord(
  record: Omit<OperationRecord, 'id' | 'timestamp'>,
): void {
  const records = getOperationRecords();
  records.unshift({
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  });
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records.slice(0, 500)));
}

export function clearOperationRecords(): void {
  localStorage.removeItem(RECORDS_KEY);
}

export function getWalletRecords(): WalletRecord[] {
  try {
    const raw = localStorage.getItem(WALLETS_KEY);
    return raw ? (JSON.parse(raw) as WalletRecord[]) : [];
  } catch {
    return [];
  }
}

export function addWalletRecord(address: string, privateKey: string): void {
  const records = getWalletRecords();
  const existing = records.findIndex((r) => r.address === address);
  const entry: WalletRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    address,
    privateKey,
    timestamp: Date.now(),
  };
  if (existing >= 0) {
    records[existing] = entry;
  } else {
    records.unshift(entry);
  }
  localStorage.setItem(WALLETS_KEY, JSON.stringify(records.slice(0, 200)));
}

export function clearWalletRecords(): void {
  localStorage.removeItem(WALLETS_KEY);
}

export function getCustomRpc(): string | null {
  return localStorage.getItem(RPC_KEY);
}

export function setCustomRpc(rpc: string | null): void {
  if (rpc?.trim()) {
    localStorage.setItem(RPC_KEY, rpc.trim());
  } else {
    localStorage.removeItem(RPC_KEY);
  }
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN');
}
