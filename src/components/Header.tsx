import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const navItems = [
  { label: '兑换', path: '/swap' },
  {
    label: '一键发币',
    path: '/create-token',
    children: [
      { label: '创建 SPL 代币', path: '/create-token' },
      { label: 'Token-2022', path: '/create-token-2022' },
    ],
  },
  {
    label: 'Solana加池',
    path: '/liquidity',
    badge: '🔥',
    children: [
      { label: 'Raydium 加池', path: '/liquidity/raydium' },
      { label: 'Orca 加池', path: '/liquidity/orca' },
      { label: '移除流动性', path: '/liquidity/remove' },
    ],
  },
  {
    label: '市值管理',
    path: '/market',
    children: [
      { label: '批量买入', path: '/market/buy' },
      { label: '批量卖出', path: '/market/sell' },
      { label: '权限管理', path: '/' },
    ],
  },
  {
    label: 'Pump',
    path: '/pump',
    children: [
      { label: 'Pump 开盘', path: '/pump/launch' },
      { label: 'Pump 狙击', path: '/pump/snipe' },
    ],
  },
  {
    label: 'LetsBonk',
    path: '/letsbonk',
    children: [
      { label: 'Bonk 开盘', path: '/letsbonk/launch' },
    ],
  },
  {
    label: '实用工具',
    path: '/tools',
    children: [
      { label: '权限管理', path: '/' },
      { label: '合约开源', path: '/opensource' },
      { label: '批量转账', path: '/tools/transfer' },
      { label: '代币销毁', path: '/tools/burn' },
      { label: '靓号生成', path: '/tools/vanity' },
    ],
  },
  { label: '教程', path: '/tutorial' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { connected, shortAddress, openWallet } = useWallet();
  const location = useLocation();

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="菜单"
          >
            <span />
            <span />
            <span />
          </button>

          <Link to="/" className="brand">
            <img src="/logo.png" alt="CPBOX-LP" className="brand-logo" />
            <span className="brand-name">CPBOX-LP</span>
          </Link>

          <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
            {navItems.map((item) => (
              <div
                key={item.label}
                className="nav-item"
                onMouseEnter={() =>
                  item.children && setOpenDropdown(item.label)
                }
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  to={item.path}
                  className={`nav-link ${
                    location.pathname === item.path ||
                    item.children?.some((c) => c.path === location.pathname)
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                  {item.children && <span className="nav-arrow">▾</span>}
                </Link>
                {item.children && openDropdown === item.label && (
                  <div className="dropdown">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className="dropdown-item"
                        onClick={() => {
                          setMenuOpen(false);
                          setOpenDropdown(null);
                        }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="header-actions">
            <button className="lang-btn">
              <span className="lang-icon">🌐</span>
              中文
              <span className="nav-arrow">▾</span>
            </button>
            <button
              className={`wallet-btn ${connected ? 'connected' : ''}`}
              onClick={openWallet}
            >
              {connected ? shortAddress : '导入钱包'}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
