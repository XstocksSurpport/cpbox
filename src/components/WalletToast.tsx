import { useWallet } from '../context/WalletContext';

export default function WalletToast() {
  const { walletToastVisible, hideWalletToast } = useWallet();

  if (!walletToastVisible) return null;

  return (
    <div className="wallet-toast">
      <span className="wallet-toast-icon">✕</span>
      <span className="wallet-toast-text">请链接钱包!</span>
      <button className="wallet-toast-close" onClick={hideWalletToast}>
        ×
      </button>
    </div>
  );
}
