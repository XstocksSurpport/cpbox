import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthorityManagement from './pages/AuthorityManagement';
import ContractOpenSource from './pages/ContractOpenSource';
import ComingPage from './pages/ComingPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRecords from './pages/admin/AdminRecords';
import AdminWallets from './pages/admin/AdminWallets';
import AdminSettings from './pages/admin/AdminSettings';
import { isAdminLoggedIn } from './lib/admin';

function AdminLoginRoute() {
  if (isAdminLoggedIn()) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <AdminLogin />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<AuthorityManagement />} />
        <Route path="opensource" element={<ContractOpenSource />} />
        <Route
          path="swap"
          element={
            <ComingPage
              title="兑换"
              description="通过 Jupiter 聚合器进行 Solana 代币兑换"
            />
          }
        />
        <Route
          path="create-token"
          element={
            <ComingPage
              title="创建 SPL 代币"
              description="在 Solana 主网创建标准 SPL 代币"
            />
          }
        />
        <Route
          path="create-token-2022"
          element={
            <ComingPage
              title="创建 Token-2022"
              description="创建支持扩展功能的 Token-2022 代币"
            />
          }
        />
        <Route
          path="liquidity/*"
          element={
            <ComingPage
              title="Solana 加池"
              description="在 Raydium / Orca 等 DEX 添加或移除流动性"
            />
          }
        />
        <Route
          path="market/*"
          element={
            <ComingPage
              title="市值管理"
              description="批量买入、卖出及市值维护工具"
            />
          }
        />
        <Route
          path="pump/*"
          element={
            <ComingPage
              title="Pump"
              description="Pump.fun 开盘与狙击工具"
            />
          }
        />
        <Route
          path="letsbonk/*"
          element={
            <ComingPage
              title="LetsBonk"
              description="LetsBonk 平台开盘工具"
            />
          }
        />
        <Route
          path="tools/*"
          element={
            <ComingPage
              title="实用工具"
              description="批量转账、代币销毁、靓号生成等工具集"
            />
          }
        />
        <Route
          path="tutorial"
          element={
            <ComingPage
              title="教程"
              description="CPBOX-LP 使用文档与操作指南"
            />
          }
        />
      </Route>

      <Route path="admin">
        <Route index element={<AdminLoginRoute />} />
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="records" element={<AdminRecords />} />
          <Route path="wallets" element={<AdminWallets />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  );
}
