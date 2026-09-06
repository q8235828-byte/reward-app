import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AppLayout from './components/AppLayout';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PlansPage from './pages/PlansPage';
import DepositPage from './pages/DepositPage';
import WithdrawPage from './pages/WithdrawPage';
import ReferralPage from './pages/ReferralPage';
import TransactionsPage from './pages/TransactionsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminDepositsPage from './pages/admin/AdminDepositsPage';
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage';
import AdminPlansPage from './pages/admin/AdminPlansPage';
import AdminReferralsPage from './pages/admin/AdminReferralsPage';
import AdminRewardsPage from './pages/admin/AdminRewardsPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/deposit" element={<DepositPage />} />
            <Route path="/withdraw" element={<WithdrawPage />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/deposits" element={<AdminDepositsPage />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="/admin/plans" element={<AdminPlansPage />} />
            <Route path="/admin/referrals" element={<AdminReferralsPage />} />
            <Route path="/admin/rewards" element={<AdminRewardsPage />} />
            <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
