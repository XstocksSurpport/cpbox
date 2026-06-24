import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export function parsePrivateKey(input: string): Keypair {
  const trimmed = input.trim();

  if (trimmed.startsWith('[')) {
    const arr = JSON.parse(trimmed) as number[];
    if (arr.length !== 64) {
      throw new Error('私钥数组长度应为 64 字节');
    }
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }

  const decoded = bs58.decode(trimmed);
  if (decoded.length === 64) {
    return Keypair.fromSecretKey(decoded);
  }
  if (decoded.length === 32) {
    return Keypair.fromSeed(decoded);
  }

  throw new Error('私钥格式无效，请使用 Base58 或 JSON 数组格式');
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
