import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldIcon, LogoutIcon, HomeIcon, DepositIcon, WithdrawIcon,
  PlansIcon, ReferralIcon, TransactionsIcon,
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
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-top">
          <Link to="/" className="app-title">Rewards</Link>
          <div className="app-header-right">
            {user && ADMIN_ROLES.includes(user.role) && (
              <Link to="/admin" className="link-button">
                <ShieldIcon size={15} />
                Admin panel
              </Link>
            )}
            <Link to="/profile" className="app-user-name">{user?.fullName}</Link>
            <button type="button" className="link-button" onClick={handleLogout}>
              <LogoutIcon size={15} />
              Log out
            </button>
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
