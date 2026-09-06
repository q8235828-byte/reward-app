import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import Logo from './Logo';
import { api } from '../services/api';
import { formatCurrency, getInitials } from '../utils/format';
import {
  HomeIcon, UsersIcon, DepositIcon, WithdrawIcon, PlansIcon,
  ReferralIcon, GiftIcon, TransactionsIcon, SettingsIcon, AuditIcon, LogoutIcon,
  BellIcon, SunIcon, MoonIcon, ChevronDownIcon,
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
  const { siteName } = useBranding();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('admin-theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('admin-theme', isDark ? 'dark' : 'light');
    } catch {
      /* ignore persistence failures (private browsing, etc.) */
    }
  }, [isDark]);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setStats(res.data.stats))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const pendingCount = stats ? (stats.pendingDeposits || 0) + (stats.pendingWithdrawals || 0) : 0;

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link to="/admin" className="app-title"><Logo />{siteName} Admin</Link>

        <div className="admin-topbar-right">
          {stats && (
            <div className="balance-chip" title="Total deposits processed on the platform">
              <span className="balance-chip-label">Platform balance</span>
              <span className="balance-chip-value">{formatCurrency(stats.totalDeposits)}</span>
            </div>
          )}

          <button
            type="button"
            className="icon-btn"
            aria-label="Notifications"
            title={pendingCount > 0 ? `${pendingCount} items awaiting review` : 'No pending items'}
          >
            <BellIcon size={18} />
            {pendingCount > 0 && <span className="notif-badge">{pendingCount > 9 ? '9+' : pendingCount}</span>}
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label="Toggle dark mode"
            onClick={() => setIsDark((v) => !v)}
          >
            {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>

          <div className="user-menu">
            <button type="button" className="user-menu-button" onClick={() => setMenuOpen((v) => !v)}>
              <span className="user-avatar">{getInitials(user?.fullName)}</span>
              <span className="app-user-name">{user?.fullName}</span>
              <ChevronDownIcon size={15} />
            </button>
            {menuOpen && (
              <div className="user-menu-dropdown" onMouseLeave={() => setMenuOpen(false)}>
                <Link to="/" className="user-menu-item" onClick={() => setMenuOpen(false)}>User view</Link>
                <button type="button" className="user-menu-item" onClick={handleLogout}>
                  <LogoutIcon size={15} />
                  Log out
                </button>
              </div>
            )}
          </div>
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
