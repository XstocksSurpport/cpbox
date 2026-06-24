import { useEffect, useState } from 'react';
import {
  getOperationRecords,
  formatTime,
  type OperationRecord,
} from '../../lib/storage';
import { fetchServerRecords } from '../../lib/adminApi';

function mergeRecords(
  local: OperationRecord[],
  remote: OperationRecord[],
): OperationRecord[] {
  const map = new Map<string, OperationRecord>();
  for (const r of [...remote, ...local]) {
    map.set(r.id, r);
  }
  return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
}

export default function AdminRecords() {
  const [records, setRecords] = useState<OperationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const remote = await fetchServerRecords();
      setRecords(mergeRecords(getOperationRecords(), remote));
    } catch {
      setRecords(getOperationRecords());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-section-header">
        <h1>操作记录</h1>
        <button className="btn btn-action btn-sm" onClick={refresh}>
          刷新
        </button>
      </div>

      {loading ? (
        <p className="admin-empty">加载中...</p>
      ) : records.length === 0 ? (
        <p className="admin-empty">暂无操作记录</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>合约地址</th>
              <th>代币名称</th>
              <th>操作</th>
              <th>钱包地址</th>
              <th>交易签名</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{formatTime(r.timestamp)}</td>
                <td>{r.type === 'opensource' ? '开源' : '权限'}</td>
                <td className="mono">{r.mintAddress.slice(0, 10)}...</td>
                <td>{r.tokenName}</td>
                <td>{r.action}</td>
                <td className="mono">{r.wallet.slice(0, 10)}...</td>
                <td className="mono">
                  {r.signature ? `${r.signature.slice(0, 12)}...` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
