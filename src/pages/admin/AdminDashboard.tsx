import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getOperationRecords,
  getWalletRecords,
  formatTime,
  getCustomRpc,
  type OperationRecord,
  type WalletRecord,
} from '../../lib/storage';
import { fetchServerRecords, fetchServerWallets } from '../../lib/adminApi';
import { DEFAULT_RPC } from '../../lib/solana';

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

function mergeWallets(local: WalletRecord[], remote: WalletRecord[]): WalletRecord[] {
  const map = new Map<string, WalletRecord>();
  for (const r of [...remote, ...local]) {
    map.set(r.address, r);
  }
  return Array.from(map.values());
}

export default function AdminDashboard() {
  const [records, setRecords] = useState<OperationRecord[]>([]);
  const [wallets, setWallets] = useState<WalletRecord[]>([]);

  useEffect(() => {
    Promise.all([
      fetchServerRecords().catch(() => []),
      fetchServerWallets().catch(() => []),
    ]).then(([remoteRecords, remoteWallets]) => {
      setRecords(mergeRecords(getOperationRecords(), remoteRecords));
      setWallets(mergeWallets(getWalletRecords(), remoteWallets));
    });
  }, []);

  const openSourceCount = records.filter((r) => r.type === 'opensource').length;
  const authorityCount = records.filter((r) => r.type === 'authority').length;

  return (
    <div className="admin-page">
      <h1>数据概览</h1>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-num">{wallets.length}</span>
          <span className="admin-stat-label">导入钱包</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-num">{records.length}</span>
          <span className="admin-stat-label">总操作记录</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-num">{openSourceCount}</span>
          <span className="admin-stat-label">开源操作</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-num">{authorityCount}</span>
          <span className="admin-stat-label">权限操作</span>
        </div>
      </div>

      <div className="admin-section">
        <h2>系统信息</h2>
        <div className="admin-info-row">
          <span>RPC 节点</span>
          <span className="mono">{getCustomRpc() || DEFAULT_RPC}</span>
        </div>
        <div className="admin-info-row">
          <span>后台地址</span>
          <span className="mono">/admin</span>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>最近操作</h2>
          <Link to="/admin/records">查看全部</Link>
        </div>
        {records.length === 0 ? (
          <p className="admin-empty">暂无操作记录</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>类型</th>
                <th>代币</th>
                <th>操作</th>
                <th>钱包</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 10).map((r) => (
                <tr key={r.id}>
                  <td>{formatTime(r.timestamp)}</td>
                  <td>{r.type === 'opensource' ? '开源' : '权限'}</td>
                  <td>{r.tokenName}</td>
                  <td>{r.action}</td>
                  <td className="mono">{r.wallet.slice(0, 8)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
