import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import {
  getMint,
  getAccount,
  setAuthority,
  AuthorityType,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  freezeAccount,
  thawAccount,
} from '@solana/spl-token';
import { getCustomRpc } from './storage';

const METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
);

export const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';

export function getConnection(): Connection {
  const rpc = getCustomRpc() || DEFAULT_RPC;
  return new Connection(rpc, 'confirmed');
}

export interface WalletPermissions {
  isMintAuthority: boolean;
  isFreezeAuthority: boolean;
  isMetadataAuthority: boolean;
  hasAnyPermission: boolean;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  supply: string;
  decimals: number;
  tokenStandard: 'Token' | 'Token2022';
  mintAuthority: string | null;
  freezeAuthority: string | null;
  metadataAuthority: string | null;
  isMutable: boolean | null;
  isOpenSource: boolean;
  isInitialized: boolean;
  walletPermissions: WalletPermissions | null;
}

function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [new TextEncoder().encode('metadata'), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METADATA_PROGRAM_ID,
  );
  return pda;
}

function readBorshString(data: Uint8Array, offset: number): { value: string; next: number } {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const len = view.getUint32(offset, true);
  const value = new TextDecoder()
    .decode(data.subarray(offset + 4, offset + 4 + len))
    .replace(/\0/g, '')
    .trim();
  return { value, next: offset + 4 + len };
}

async function fetchMetaplexMetadata(
  connection: Connection,
  mint: PublicKey,
): Promise<{
  name: string;
  symbol: string;
  updateAuthority: string | null;
  isMutable: boolean;
} | null> {
  const pda = getMetadataPDA(mint);
  const account = await connection.getAccountInfo(pda);
  if (!account) return null;

  const data = account.data;
  let offset = 1;
  const updateAuth = new PublicKey(data.subarray(offset, offset + 32));
  offset += 64;
  const name = readBorshString(data, offset);
  const symbol = readBorshString(data, name.next);

  const revoked =
    updateAuth.equals(PublicKey.default) ||
    updateAuth.equals(SystemProgramId());

  const isMutable = data.length > 1 + 32 + 32 + 4 ? data[data.length - 1] === 1 : true;

  return {
    name: name.value || '未知代币',
    symbol: symbol.value || '',
    updateAuthority: revoked ? null : updateAuth.toBase58(),
    isMutable,
  };
}

function SystemProgramId(): PublicKey {
  return new PublicKey('11111111111111111111111111111111');
}

async function resolveMintProgram(
  connection: Connection,
  mint: PublicKey,
): Promise<{ programId: PublicKey; isToken2022: boolean }> {
  const account = await connection.getAccountInfo(mint);
  if (!account) throw new Error('代币合约不存在');

  if (account.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return { programId: TOKEN_2022_PROGRAM_ID, isToken2022: true };
  }
  if (account.owner.equals(TOKEN_PROGRAM_ID)) {
    return { programId: TOKEN_PROGRAM_ID, isToken2022: false };
  }
  throw new Error('不是有效的 SPL 代币合约');
}

function buildWalletPermissions(
  walletAddress: string | null,
  mintAuthority: string | null,
  freezeAuthority: string | null,
  metadataAuthority: string | null,
): WalletPermissions | null {
  if (!walletAddress) return null;

  const isMintAuthority = !!mintAuthority && mintAuthority === walletAddress;
  const isFreezeAuthority = !!freezeAuthority && freezeAuthority === walletAddress;
  const isMetadataAuthority =
    !!metadataAuthority && metadataAuthority === walletAddress;

  return {
    isMintAuthority,
    isFreezeAuthority,
    isMetadataAuthority,
    hasAnyPermission: isMintAuthority || isFreezeAuthority || isMetadataAuthority,
  };
}

function isFullyOpenSource(
  mintAuthority: string | null,
  freezeAuthority: string | null,
  metadataAuthority: string | null,
): boolean {
  return !mintAuthority && !freezeAuthority && !metadataAuthority;
}

export async function fetchTokenInfo(
  mintAddress: string,
  walletAddress?: string | null,
): Promise<TokenInfo> {
  const connection = getConnection();
  const mint = new PublicKey(mintAddress);
  const { programId, isToken2022 } = await resolveMintProgram(connection, mint);
  const mintInfo = await getMint(connection, mint, undefined, programId);
  const metadata = await fetchMetaplexMetadata(connection, mint);

  const divisor = BigInt(10 ** mintInfo.decimals);
  const whole = mintInfo.supply / divisor;
  const frac = mintInfo.supply % divisor;
  const supplyStr =
    frac === 0n
      ? whole.toLocaleString()
      : `${whole.toLocaleString()}.${frac.toString().padStart(mintInfo.decimals, '0').replace(/0+$/, '')}`;

  const mintAuthority = mintInfo.mintAuthority?.toBase58() ?? null;
  const freezeAuthority = mintInfo.freezeAuthority?.toBase58() ?? null;
  const metadataAuthority = metadata?.updateAuthority ?? null;

  return {
    address: mintAddress,
    name: metadata?.name ?? `Token ${mintAddress.slice(0, 6)}`,
    symbol: metadata?.symbol ?? '',
    supply: supplyStr,
    decimals: mintInfo.decimals,
    tokenStandard: isToken2022 ? 'Token2022' : 'Token',
    mintAuthority,
    freezeAuthority,
    metadataAuthority,
    isMutable: metadata?.isMutable ?? null,
    isOpenSource: isFullyOpenSource(mintAuthority, freezeAuthority, metadataAuthority),
    isInitialized: mintInfo.isInitialized,
    walletPermissions: buildWalletPermissions(
      walletAddress ?? null,
      mintAuthority,
      freezeAuthority,
      metadataAuthority,
    ),
  };
}

export async function revokeMintAuthority(
  keypair: Keypair,
  mintAddress: string,
): Promise<string> {
  const connection = getConnection();
  const mint = new PublicKey(mintAddress);
  const { programId } = await resolveMintProgram(connection, mint);
  return setAuthority(
    connection,
    keypair,
    mint,
    keypair,
    AuthorityType.MintTokens,
    null,
    [],
    undefined,
    programId,
  );
}

export async function revokeFreezeAuthority(
  keypair: Keypair,
  mintAddress: string,
): Promise<string> {
  const connection = getConnection();
  const mint = new PublicKey(mintAddress);
  const { programId } = await resolveMintProgram(connection, mint);
  return setAuthority(
    connection,
    keypair,
    mint,
    keypair,
    AuthorityType.FreezeAccount,
    null,
    [],
    undefined,
    programId,
  );
}

export async function transferMintAuthority(
  keypair: Keypair,
  mintAddress: string,
  newAuthority: string,
): Promise<string> {
  const connection = getConnection();
  const mint = new PublicKey(mintAddress);
  const newAuth = new PublicKey(newAuthority);
  const { programId } = await resolveMintProgram(connection, mint);
  return setAuthority(
    connection,
    keypair,
    mint,
    keypair,
    AuthorityType.MintTokens,
    newAuth,
    [],
    undefined,
    programId,
  );
}

function createRevokeMetadataInstruction(
  metadata: PublicKey,
  updateAuthority: PublicKey,
): TransactionInstruction {
  const data = new Uint8Array(38);
  let o = 0;
  data[o++] = 15;
  data[o++] = 0;
  data[o++] = 1;
  data.set(PublicKey.default.toBytes(), o);
  o += 32;
  data[o++] = 0;
  data[o++] = 1;
  data[o++] = 0;

  return new TransactionInstruction({
    programId: METADATA_PROGRAM_ID,
    keys: [
      { pubkey: metadata, isSigner: false, isWritable: true },
      { pubkey: updateAuthority, isSigner: true, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

export async function revokeMetadataAuthority(
  keypair: Keypair,
  mintAddress: string,
): Promise<string> {
  const connection = getConnection();
  const mint = new PublicKey(mintAddress);
  const metadata = getMetadataPDA(mint);
  const account = await connection.getAccountInfo(metadata);
  if (!account) throw new Error('该代币无链上元数据账户');

  const tx = new Transaction().add(
    createRevokeMetadataInstruction(metadata, keypair.publicKey),
  );
  return sendAndConfirmTransaction(connection, tx, [keypair]);
}

export async function openSourceAll(
  keypair: Keypair,
  mintAddress: string,
  tokenInfo: TokenInfo,
): Promise<string[]> {
  const signatures: string[] = [];
  const wallet = keypair.publicKey.toBase58();

  if (tokenInfo.mintAuthority === wallet) {
    signatures.push(await revokeMintAuthority(keypair, mintAddress));
  }
  if (tokenInfo.freezeAuthority === wallet) {
    signatures.push(await revokeFreezeAuthority(keypair, mintAddress));
  }
  if (tokenInfo.metadataAuthority === wallet) {
    signatures.push(await revokeMetadataAuthority(keypair, mintAddress));
  }

  if (signatures.length === 0) {
    throw new Error('当前钱包不持有任何可放弃的权限');
  }

  return signatures;
}
