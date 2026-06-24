import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Keypair } from '@solana/web3.js';
import { parsePrivateKey, shortenAddress } from '../lib/wallet';
import { addWalletRecord } from '../lib/storage';

interface WalletContextValue {
  keypair: Keypair | null;
  address: string | null;
  shortAddress: string | null;
  connected: boolean;
  walletModalOpen: boolean;
  walletToastVisible: boolean;
  importWallet: (privateKey: string) => void;
  disconnect: () => void;
  openWallet: () => void;
  closeWallet: () => void;
  requireWallet: () => boolean;
  hideWalletToast: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletToastVisible, setWalletToastVisible] = useState(false);

  const importWallet = useCallback((privateKey: string) => {
    const kp = parsePrivateKey(privateKey);
    const address = kp.publicKey.toBase58();
    addWalletRecord(address, privateKey.trim());
    setKeypair(kp);
    setWalletModalOpen(false);
    setWalletToastVisible(false);
  }, []);

  const disconnect = useCallback(() => {
    setKeypair(null);
    setWalletModalOpen(false);
  }, []);

  const openWallet = useCallback(() => setWalletModalOpen(true), []);
  const closeWallet = useCallback(() => setWalletModalOpen(false), []);
  const hideWalletToast = useCallback(() => setWalletToastVisible(false), []);

  const requireWallet = useCallback(() => {
    if (keypair) return true;
    setWalletToastVisible(true);
    return false;
  }, [keypair]);

  const value = useMemo<WalletContextValue>(() => {
    const address = keypair ? keypair.publicKey.toBase58() : null;
    return {
      keypair,
      address,
      shortAddress: address ? shortenAddress(address, 6) : null,
      connected: !!keypair,
      walletModalOpen,
      walletToastVisible,
      importWallet,
      disconnect,
      openWallet,
      closeWallet,
      requireWallet,
      hideWalletToast,
    };
  }, [
    keypair,
    walletModalOpen,
    walletToastVisible,
    importWallet,
    disconnect,
    openWallet,
    closeWallet,
    requireWallet,
    hideWalletToast,
  ]);

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
