import { useState } from 'react';
import { getCustomRpc, setCustomRpc } from '../../lib/storage';
import { DEFAULT_RPC } from '../../lib/solana';

export default function AdminSettings() {
  const [rpc, setRpc] = useState(getCustomRpc() || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setCustomRpc(rpc.trim() || null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="admin-page">
      <h1>系统设置</h1>
      <div className="admin-section">
        <label className="form-label">Solana RPC 节点</label>
        <input
          type="text"
          className="form-input admin-rpc-input"
          placeholder={DEFAULT_RPC}
          value={rpc}
          onChange={(e) => setRpc(e.target.value)}
        />
        <p className="form-hint">留空则使用默认主网节点</p>
        <button className="btn btn-primary" onClick={handleSave}>
          保存设置
        </button>
        {saved && <span className="save-hint">已保存</span>}
      </div>
    </div>
  );
}
