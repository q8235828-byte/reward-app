import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { getInitials } from '../utils/format';
import Logo from './Logo';
import {
  ShieldIcon, LogoutIcon, HomeIcon, DepositIcon, WithdrawIcon,
  PlansIcon, ReferralIcon, TransactionsIcon, ChevronDownIcon,
} from './icons';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true, icon: HomeIcon },
  { to: '/deposit', label: 'Deposit', icon: DepositIcon },
  { to: '/withdraw', label: 'Withdraw', icon: WithdrawIcon },
  { to: '/plans', label: 'Plans', icon: PlansIcon },
  { to: '/referral', label: 'Referral', icon: ReferralIcon },
  { to: '/transactions', label: 'Transactions', icon: TransactionsIcon },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { siteName } = useBranding();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-top">
          <Link to="/" className="app-title"><Logo />{siteName}</Link>

          <div className="user-menu">
            <button type="button" className="user-menu-button" onClick={() => setMenuOpen((v) => !v)}>
              <span className="user-avatar">{getInitials(user?.fullName)}</span>
              <span className="app-user-name">{user?.fullName}</span>
              <ChevronDownIcon size={15} />
            </button>
            {menuOpen && (
              <div className="user-menu-dropdown" onMouseLeave={() => setMenuOpen(false)}>
                <Link to="/profile" className="user-menu-item" onClick={() => setMenuOpen(false)}>Profile</Link>
                {user && ADMIN_ROLES.includes(user.role) && (
                  <Link to="/admin" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                    <ShieldIcon size={15} />
                    Admin panel
                  </Link>
                )}
                <button type="button" className="user-menu-item" onClick={handleLogout}>
                  <LogoutIcon size={15} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
        <nav className="app-nav">
          {NAV_ITEMS.map((item) => {
            const ItemIcon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
              >
                <ItemIcon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
