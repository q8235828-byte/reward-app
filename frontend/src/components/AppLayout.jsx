import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

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
        <Link to="/" className="app-title">Rewards</Link>
        <div className="app-header-right">
          {user && ADMIN_ROLES.includes(user.role) && (
            <Link to="/admin" className="link-button">Admin panel</Link>
          )}
          <span className="app-user-name">{user?.fullName}</span>
          <button type="button" className="link-button" onClick={handleLogout}>Log out</button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
