import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { addOperationRecord } from '../lib/storage';
import type { TokenInfo } from '../lib/solana';

async function loadSolana() {
  return import('../lib/solana');
}

type Tab = 'revoke' | 'mint' | 'freeze' | 'advanced';

export default function AuthorityManagement() {
  const { keypair, address, requireWallet } = useWallet();
  const [tab, setTab] = useState<Tab>('revoke');
  const [mintAddress, setMintAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newAuthority, setNewAuthority] = useState('');
  const [mintAmount, setMintAmount] = useState('');

  const handleQuery = async () => {
    setError('');
    setSuccess('');
    setTokenInfo(null);

    if (!requireWallet()) return;
    if (!mintAddress.trim()) {
      setError('请输入代币地址');
      return;
    }

    setLoading(true);
    try {
      const { fetchTokenInfo } = await loadSolana();
      const info = await fetchTokenInfo(mintAddress.trim(), address);
      setTokenInfo(info);
    } catch (e) {
      setError(e instanceof Error ? e.message : '查询失败，请检查代币地址');
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (
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
      setSuccess(`交易成功: ${sig}`);
      const { fetchTokenInfo } = await loadSolana();
      const info = await fetchTokenInfo(mintAddress.trim(), address);
      setTokenInfo(info);

      addOperationRecord({
        type: 'authority',
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

  const perms = tokenInfo?.walletPermissions;

  return (
    <div className="page page-wide">
        <h1 className="page-title">权限管理</h1>
        <a
          href="https://docs.solana.com/developing/programming-model/calling-programs"
          target="_blank"
          rel="noopener noreferrer"
          className="tutorial-link"
        >
          查看教程
        </a>

        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="请输入代币地址"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            className="btn btn-search"
            onClick={handleQuery}
            disabled={loading}
          >
            {loading ? '查询中...' : '查询代币'}
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

            {perms && (
              <div
                className={`wallet-perm-banner ${perms.hasAnyPermission ? 'has-perm' : 'no-perm'}`}
              >
                {perms.hasAnyPermission
                  ? '当前钱包持有该代币的管理权限'
                  : '当前钱包不持有该代币的管理权限'}
              </div>
            )}

            <div className="func-tabs">
              {(
                [
                  ['revoke', '丢弃权限'],
                  ['mint', '增发代币'],
                  ['freeze', '冻结/解冻账户'],
                  ['advanced', '高级功能'],
                ] as [Tab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  className={`func-tab ${tab === key ? 'active' : ''}`}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'revoke' && (
              <div className="tab-content">
                <ToggleRow
                  label="丢弃增发权限"
                  authority={tokenInfo.mintAuthority}
                  owned={perms?.isMintAuthority}
                  checked={!tokenInfo.mintAuthority}
                  loading={actionLoading === 'revoke-mint'}
                  onToggle={() =>
                    runAction(
                      'revoke-mint',
                      async () => {
                        const { revokeMintAuthority } = await loadSolana();
                        return revokeMintAuthority(keypair!, mintAddress.trim());
                      },
                      '丢弃增发权限',
                    )
                  }
                />
                <ToggleRow
                  label="丢弃冻结权限"
                  authority={tokenInfo.freezeAuthority}
                  owned={perms?.isFreezeAuthority}
                  checked={!tokenInfo.freezeAuthority}
                  loading={actionLoading === 'revoke-freeze'}
                  onToggle={() =>
                    runAction(
                      'revoke-freeze',
                      async () => {
                        const { revokeFreezeAuthority } = await loadSolana();
                        return revokeFreezeAuthority(keypair!, mintAddress.trim());
                      },
                      '丢弃冻结权限',
                    )
                  }
                />
                <ToggleRow
                  label="禁止更新资料"
                  authority={tokenInfo.metadataAuthority}
                  owned={perms?.isMetadataAuthority}
                  checked={!tokenInfo.metadataAuthority}
                  loading={actionLoading === 'revoke-metadata'}
                  onToggle={() =>
                    runAction(
                      'revoke-metadata',
                      async () => {
                        const { revokeMetadataAuthority } = await loadSolana();
                        return revokeMetadataAuthority(keypair!, mintAddress.trim());
                      },
                      '禁止更新资料',
                    )
                  }
                />
              </div>
            )}

            {tab === 'mint' && (
              <div className="tab-content">
                {!perms?.isMintAuthority ? (
                  <p className="tab-hint">当前钱包无增发权限</p>
                ) : (
                  <div className="action-group">
                    <h3>增发代币</h3>
                    <p className="action-desc">向指定地址增发代币（功能开发中）</p>
                    <div className="transfer-row">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="增发数量"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(e.target.value)}
                      />
                      <button className="btn btn-action" disabled>
                        确认增发
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'freeze' && (
              <div className="tab-content">
                <p className="tab-hint">
                  {perms?.isFreezeAuthority
                    ? '当前钱包持有冻结权限，可冻结/解冻持有者账户（功能开发中）'
                    : '当前钱包无冻结权限'}
                </p>
              </div>
            )}

            {tab === 'advanced' && (
              <div className="tab-content">
                {perms?.isMintAuthority ? (
                  <div className="action-group">
                    <h3>转移铸币权限</h3>
                    <p className="action-desc">将铸币权限转移给其他地址</p>
                    <div className="transfer-row">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="新权限持有者地址"
                        value={newAuthority}
                        onChange={(e) => setNewAuthority(e.target.value)}
                      />
                      <button
                        className="btn btn-action"
                        disabled={
                          !!actionLoading ||
                          !newAuthority.trim() ||
                          !tokenInfo.mintAuthority
                        }
                        onClick={() =>
                          runAction(
                            'transfer-mint',
                            async () => {
                              const { transferMintAuthority } = await loadSolana();
                              return transferMintAuthority(
                                keypair!,
                                mintAddress.trim(),
                                newAuthority.trim(),
                              );
                            },
                            '转移铸币权限',
                          )
                        }
                      >
                        {actionLoading === 'transfer-mint'
                          ? '处理中...'
                          : '转移权限'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="tab-hint">当前钱包无高级操作权限</p>
                )}

                <div className="info-grid" style={{ marginTop: 24 }}>
                  <div className="info-row">
                    <span className="info-label">总供应量</span>
                    <span className="info-value">{tokenInfo.supply}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">精度</span>
                    <span className="info-value">{tokenInfo.decimals}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">铸币权限</span>
                    <span className="info-value mono">
                      {tokenInfo.mintAuthority ?? '已放弃'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">冻结权限</span>
                    <span className="info-value mono">
                      {tokenInfo.freezeAuthority ?? '已放弃'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">元数据权限</span>
                    <span className="info-value mono">
                      {tokenInfo.metadataAuthority ?? '已放弃'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
  );
}

function ToggleRow({
  label,
  authority,
  owned,
  checked,
  loading,
  onToggle,
}: {
  label: string;
  authority: string | null;
  owned?: boolean;
  checked: boolean;
  loading?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="toggle-row">
      <div className="toggle-row-info">
        <span className="toggle-label">{label}</span>
        {authority && (
          <span className="toggle-addr mono">
            {owned ? '当前钱包持有' : authority.slice(0, 12) + '...'}
          </span>
        )}
      </div>
      <label className={`toggle-switch ${checked ? 'on' : ''} ${!owned || checked ? 'disabled' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={checked || !owned || loading}
          onChange={() => onToggle?.()}
        />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}
