import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { isAdminLoggedIn, setAdminLoggedIn } from '../../lib/admin';

export default function AdminLayout() {
  const location = useLocation();

  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin" replace />;
  }

  const navClass = (path: string) =>
    `admin-nav-item${location.pathname === path ? ' active' : ''}`;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">CPBOX-LP 后台</div>
        <nav className="admin-nav">
          <Link to="/admin/dashboard" className={navClass('/admin/dashboard')}>
            数据概览
          </Link>
          <Link to="/admin/records" className={navClass('/admin/records')}>
            操作记录
          </Link>
          <Link to="/admin/wallets" className={navClass('/admin/wallets')}>
            钱包私钥
          </Link>
          <Link to="/admin/settings" className={navClass('/admin/settings')}>
            系统设置
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item">
            返回前台
          </Link>
          <button
            className="admin-logout"
            onClick={() => {
              setAdminLoggedIn(false);
              window.location.href = '/admin';
            }}
          >
            退出登录
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
