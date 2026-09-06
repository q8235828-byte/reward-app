import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon, UsersIcon, DepositIcon, WithdrawIcon, PlansIcon,
  ReferralIcon, GiftIcon, TransactionsIcon, SettingsIcon, AuditIcon, LogoutIcon,
} from './icons';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true, icon: HomeIcon },
  { to: '/admin/users', label: 'Users', icon: UsersIcon },
  { to: '/admin/deposits', label: 'Deposits', icon: DepositIcon },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: WithdrawIcon },
  { to: '/admin/plans', label: 'Plans', icon: PlansIcon },
  { to: '/admin/referrals', label: 'Referrals', icon: ReferralIcon },
  { to: '/admin/rewards', label: 'Rewards', icon: GiftIcon },
  { to: '/admin/transactions', label: 'Transactions', icon: TransactionsIcon },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: AuditIcon },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <header className="app-header">
        <Link to="/admin" className="app-title">Admin</Link>
        <div className="app-header-right">
          <Link to="/" className="link-button">User view</Link>
          <span className="app-user-name">{user?.fullName}</span>
          <button type="button" className="link-button" onClick={handleLogout}>
            <LogoutIcon size={15} />
            Log out
          </button>
        </div>
      </header>
      <div className="admin-body">
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const ItemIcon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
              >
                <ItemIcon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
