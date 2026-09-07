import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUSES = ['', 'PENDING', 'PROCESSING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'];

const NEXT_ACTIONS = {
  PENDING: [['approve', 'Approve'], ['reject', 'Reject']],
  APPROVED: [['processing', 'Mark processing'], ['paid', 'Mark paid'], ['reject', 'Reject']],
  PROCESSING: [['paid', 'Mark paid'], ['reject', 'Reject']],
};

export default function AdminWithdrawalsPage() {
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
    api.get(`/admin/withdrawals?${query.toString()}`)
      .then((res) => { setItems(res.data.items); setPagination(res.data.pagination); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, page]);

  const handleAction = async (id, action) => {
    setActionError('');
    setBusyId(id);
    try {
      await api.post(`/admin/withdrawals/${id}/${action}`, {});
      load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1>Withdrawals</h1>
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
              <tr><th>User</th><th>Amount</th><th>Method</th><th>Account</th><th>Status</th><th>Date</th><th /></tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id}>
                  <td>{w.userFullName}<br /><span className="muted">{w.userPhone}</span></td>
                  <td>{formatCurrency(w.amount)}</td>
                  <td>{w.paymentMethod}</td>
                  <td>{w.accountName}<br /><span className="muted">{w.accountNumber}</span></td>
                  <td><span className={`status-badge status-${w.status.toLowerCase()}`}>{w.status}</span></td>
                  <td>{formatDate(w.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      {(NEXT_ACTIONS[w.status] || []).map(([action, label]) => (
                        <button key={action} type="button" disabled={busyId === w.id} onClick={() => handleAction(w.id, action)}>
                          {label}
                        </button>
                      ))}
                    </div>
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
