import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUSES = ['', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function AdminDepositsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    const query = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (status) query.set('status', status);
    api.get(`/admin/deposits?${query.toString()}`)
      .then((res) => { setItems(res.data.items); setPagination(res.data.pagination); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, page]);

  const handleAction = async (id, action) => {
    setActionError('');
    setBusyId(id);
    try {
      await api.post(`/admin/deposits/${id}/${action}`, {});
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1>Deposits</h1>
      <div className="filter-row">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`filter-chip ${status === s ? 'active' : ''}`}
            onClick={() => { setStatus(s); setPage(1); }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      {actionError && <p className="form-error">{actionError}</p>}

      {loading ? <p>Loading…</p> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>User</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th>Date</th><th /></tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td>{d.userFullName}<br /><span className="muted">{d.userPhone}</span></td>
                  <td>{formatCurrency(d.amount)}</td>
                  <td>{d.paymentMethod}</td>
                  <td>{d.transactionReference || '—'}</td>
                  <td><span className={`status-badge status-${d.status.toLowerCase()}`}>{d.status}</span></td>
                  <td>{formatDate(d.createdAt)}</td>
                  <td>
                    {['PENDING', 'UNDER_REVIEW'].includes(d.status) && (
                      <div className="row-actions">
                        <button type="button" disabled={busyId === d.id} onClick={() => handleAction(d.id, 'approve')}>
                          Approve
                        </button>
                        <button type="button" disabled={busyId === d.id} onClick={() => handleAction(d.id, 'reject')}>
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
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
