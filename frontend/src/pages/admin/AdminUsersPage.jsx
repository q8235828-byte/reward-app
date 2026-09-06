import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

const STATUSES = ['', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'PENDING'];

export default function AdminUsersPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    api.get(`/admin/users?${query.toString()}`)
      .then((res) => { setItems(res.data.items); setPagination(res.data.pagination); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, status, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div>
      <h1>Users</h1>
      <form className="filter-form" onSubmit={handleSearchSubmit}>
        <input
          placeholder="Search name, email, phone, referral code"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
        <button type="submit">Search</button>
      </form>

      {error && <p className="form-error">{error}</p>}
      {loading ? <p>Loading…</p> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Joined</th><th /></tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td><span className={`status-badge status-${u.status.toLowerCase()}`}>{u.status}</span></td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td><Link to={`/admin/users/${u.id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={pagination?.totalPages} onChange={setPage} />
    </div>
  );
}
