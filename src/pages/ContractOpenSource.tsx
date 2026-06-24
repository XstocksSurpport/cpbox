import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { addOperationRecord } from '../lib/storage';
import type { TokenInfo } from '../lib/solana';

async function loadSolana() {
  return import('../lib/solana');
}

export default function ContractOpenSource() {
  const { keypair, address, requireWallet } = useWallet();
  const [mintAddress, setMintAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleQuery = async () => {
    setError('');
    setSuccess('');
    setTokenInfo(null);

    if (!requireWallet()) return;
    if (!mintAddress.trim()) {
      setError('请输入合约地址');
      return;
    }

    setLoading(true);
    try {
      const { fetchTokenInfo } = await loadSolana();
      const info = await fetchTokenInfo(mintAddress.trim(), address);
      setTokenInfo(info);
    } catch (e) {
      setError(e instanceof Error ? e.message : '查询失败');
    } finally {
      setLoading(false);
    }
  };

  const runRevoke = async (
    action: string,
    fn: () => Promise<string>,
    label: string,
  ) => {
    if (!requireWallet() || !keypair) return;
    setError('');
    setSuccess('');
    setActionLoading(action);
    try {
      const sig = await fn();
      setSuccess(`操作成功，交易签名: ${sig}`);
      const { fetchTokenInfo } = await loadSolana();
      const info = await fetchTokenInfo(mintAddress.trim(), address);
      setTokenInfo(info);

      addOperationRecord({
        type: 'opensource',
        wallet: address!,
        mintAddress: mintAddress.trim(),
        tokenName: info.name,
        action: label,
        signature: sig,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setActionLoading('');
    }
  };

  const handleOpenSourceAll = async () => {
    if (!requireWallet() || !keypair || !tokenInfo) return;
    setError('');
    setSuccess('');
    setActionLoading('all');
    try {
      const { openSourceAll, fetchTokenInfo } = await loadSolana();
      const sigs = await openSourceAll(keypair, mintAddress.trim(), tokenInfo);
      setSuccess(`一键开源完成，共 ${sigs.length} 笔交易`);
      const info = await fetchTokenInfo(mintAddress.trim(), address);
      setTokenInfo(info);

      addOperationRecord({
        type: 'opensource',
        wallet: address!,
        mintAddress: mintAddress.trim(),
        tokenName: info.name,
        action: '一键开源',
        signature: sigs.join(', '),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setActionLoading('');
    }
  };

  const perms = tokenInfo?.walletPermissions;

  return (
    <div className="page page-wide">
        <h1 className="page-title">合约开源</h1>
        <p className="page-subtitle">
          放弃所有管理权限，使合约完全开源透明
        </p>

        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="请输入合约地址"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            className="btn btn-search"
            onClick={handleQuery}
            disabled={loading}
          >
            {loading ? '查询中...' : '查询合约'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {tokenInfo && (
          <div className="token-panel">
            <div className="token-header">
              <div>
                <span className="token-name">{tokenInfo.name}</span>
                {tokenInfo.symbol && (
                  <span className="token-symbol">({tokenInfo.symbol})</span>
                )}
              </div>
              <span className="token-badge">{tokenInfo.tokenStandard}</span>
            </div>

            <div
              className={`opensource-status ${tokenInfo.isOpenSource ? 'done' : 'pending'}`}
            >
              {tokenInfo.isOpenSource ? '已开源' : '未完全开源'}
            </div>

            {perms && (
              <div
                className={`wallet-perm-banner ${perms.hasAnyPermission ? 'has-perm' : 'no-perm'}`}
              >
                {perms.hasAnyPermission
                  ? '当前钱包持有该合约的管理权限'
                  : '当前钱包不持有该合约的管理权限'}
              </div>
            )}

            <div className="perm-list">
              <PermRow
                label="增发权限"
                authority={tokenInfo.mintAuthority}
                owned={perms?.isMintAuthority}
                onRevoke={
                  perms?.isMintAuthority
                    ? () =>
                        runRevoke(
                          'mint',
                          async () => {
                            const { revokeMintAuthority } = await loadSolana();
                            return revokeMintAuthority(keypair!, mintAddress.trim());
                          },
                          '放弃增发权限',
                        )
                    : undefined
                }
                loading={actionLoading === 'mint'}
              />
              <PermRow
                label="冻结权限"
                authority={tokenInfo.freezeAuthority}
                owned={perms?.isFreezeAuthority}
                onRevoke={
                  perms?.isFreezeAuthority
                    ? () =>
                        runRevoke(
                          'freeze',
                          async () => {
                            const { revokeFreezeAuthority } = await loadSolana();
                            return revokeFreezeAuthority(keypair!, mintAddress.trim());
                          },
                          '放弃冻结权限',
                        )
                    : undefined
                }
                loading={actionLoading === 'freeze'}
              />
              <PermRow
                label="元数据更新权限"
                authority={tokenInfo.metadataAuthority}
                owned={perms?.isMetadataAuthority}
                onRevoke={
                  perms?.isMetadataAuthority
                    ? () =>
                        runRevoke(
                          'metadata',
                          async () => {
                            const { revokeMetadataAuthority } = await loadSolana();
                            return revokeMetadataAuthority(keypair!, mintAddress.trim());
                          },
                          '放弃元数据权限',
                        )
                    : undefined
                }
                loading={actionLoading === 'metadata'}
              />
            </div>

            {perms?.hasAnyPermission && !tokenInfo.isOpenSource && (
              <button
                className="btn btn-primary btn-block btn-lg"
                disabled={!!actionLoading}
                onClick={handleOpenSourceAll}
              >
                {actionLoading === 'all' ? '处理中...' : '一键开源（放弃全部权限）'}
              </button>
            )}
          </div>
        )}
      </div>
  );
}

function PermRow({
  label,
  authority,
  owned,
  onRevoke,
  loading,
}: {
  label: string;
  authority: string | null;
  owned?: boolean;
  onRevoke?: () => void;
  loading?: boolean;
}) {
  const revoked = !authority;
  return (
    <div className="perm-row">
      <div className="perm-row-left">
        <span className="perm-label">{label}</span>
        <span className={`perm-status ${revoked ? 'revoked' : owned ? 'owned' : ''}`}>
          {revoked ? '已放弃' : owned ? '当前钱包持有' : '其他地址持有'}
        </span>
        {authority && <span className="perm-addr mono">{authority}</span>}
      </div>
      {onRevoke && !revoked && (
        <button
          className="btn btn-action btn-sm"
          disabled={loading}
          onClick={onRevoke}
        >
          {loading ? '处理中' : '放弃'}
        </button>
      )}
    </div>
  );
}
