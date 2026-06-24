import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAdminPassword, setAdminLoggedIn } from '../../lib/admin';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(password)) {
      setAdminLoggedIn(true);
      navigate('/admin/dashboard');
    } else {
      setError('密码错误');
    }
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
          <button type="submit" className="btn btn-primary btn-block">
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
