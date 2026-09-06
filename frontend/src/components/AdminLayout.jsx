import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/deposits', label: 'Deposits' },
  { to: '/admin/withdrawals', label: 'Withdrawals' },
  { to: '/admin/plans', label: 'Plans' },
  { to: '/admin/referrals', label: 'Referrals' },
  { to: '/admin/rewards', label: 'Rewards' },
  { to: '/admin/transactions', label: 'Transactions' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
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
          <button type="button" className="link-button" onClick={handleLogout}>Log out</button>
        </div>
      </header>
      <div className="admin-body">
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
