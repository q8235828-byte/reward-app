import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [actionInput, setActionInput] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (action) query.set('action', action);
    api.get(`/admin/audit-logs?${query.toString()}`)
      .then((res) => { setItems(res.data.items); setPagination(res.data.pagination); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [action, page]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAction(actionInput);
    setPage(1);
  };

  return (
    <div>
      <h1>Audit logs</h1>
      <form className="filter-form" onSubmit={handleSubmit}>
        <input
          placeholder="Filter by action (e.g. DEPOSIT_APPROVED)"
          value={actionInput}
          onChange={(e) => setActionInput(e.target.value)}
        />
        <button type="submit">Filter</button>
      </form>
      {error && <p className="form-error">{error}</p>}
      {loading ? <p>Loading…</p> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Admin</th><th>Action</th><th>Target</th><th>Date</th></tr></thead>
            <tbody>
              {items.map((log) => (
                <tr key={log.id}>
                  <td>{log.adminName || `#${log.adminId}`}</td>
                  <td>{log.action}</td>
                  <td>{log.targetType ? `${log.targetType} #${log.targetId}` : '—'}</td>
                  <td>{formatDate(log.createdAt)}</td>
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
