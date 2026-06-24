import { Outlet } from 'react-router-dom';
import Header from './Header';
import WalletModal from './WalletModal';
import WalletToast from './WalletToast';
import { useWallet } from '../context/WalletContext';

export default function Layout() {
  const { walletModalOpen, closeWallet } = useWallet();

  return (
    <div className="app">
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <WalletModal open={walletModalOpen} onClose={closeWallet} />
      <WalletToast />
    </div>
  );
}
