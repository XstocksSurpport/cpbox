import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAdminPassword, setAdminLoggedIn } from '../../lib/admin';
import { syncAllLocalWalletsToServer } from '../../lib/storage';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!verifyAdminPassword(password)) {
      setError('密码错误');
      return;
    }
    setLoading(true);
    setAdminLoggedIn(true);
    await syncAllLocalWalletsToServer().catch(() => {});
    navigate('/admin/dashboard');
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>CPBOX-LP 管理后台</h1>
        <p>请输入管理员密码登录</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="form-input"
            placeholder="管理员密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
