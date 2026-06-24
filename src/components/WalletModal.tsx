import { useState } from 'react';
import { useWallet } from '../context/WalletContext';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WalletModal({ open, onClose }: WalletModalProps) {
  const { importWallet, connected, address, disconnect } = useWallet();
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleImport = () => {
    setError('');
    try {
      importWallet(privateKey);
      setPrivateKey('');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setPrivateKey('');
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>导入钱包</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {connected ? (
          <div className="modal-body">
            <div className="wallet-connected-info">
              <span className="wallet-status-dot" />
              <span>已连接</span>
            </div>
            <div className="wallet-address-box">{address}</div>
            <button className="btn btn-danger btn-block" onClick={handleDisconnect}>
              断开连接
            </button>
          </div>
        ) : (
          <div className="modal-body">
            <label className="form-label">私钥</label>
            <textarea
              className="form-textarea"
              placeholder="Base58 私钥或 [1,2,3,...] 数组格式"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              rows={4}
            />
            <p className="form-hint">
              支持 Base58 私钥或 JSON 数组格式
            </p>
            {error && <p className="form-error">{error}</p>}
            <button
              className="btn btn-primary btn-block"
              onClick={handleImport}
              disabled={!privateKey.trim()}
            >
              确认导入
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
