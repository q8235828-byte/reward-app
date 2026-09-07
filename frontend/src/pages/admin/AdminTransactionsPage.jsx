import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import { formatCurrency, formatDate } from '../../utils/format';

const TYPES = ['', 'DEPOSIT', 'REWARD', 'REFERRAL_COMMISSION', 'BONUS', 'WITHDRAWAL', 'REVERSAL', 'ADJUSTMENT'];

export default function AdminTransactionsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (type) query.set('type', type);
    api.get(`/admin/transactions?${query.toString()}`)
      .then((res) => { setItems(res.data.items); setPagination(res.data.pagination); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [type, page]);

  return (
    <div>
      <h1>Transactions</h1>
      <div className="filter-row">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={`filter-chip ${type === t ? 'active' : ''}`}
            onClick={() => { setType(t); setPage(1); }}
          >
            {t.replace('_', ' ') || 'All'}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading ? <p>Loading…</p> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td>{t.userFullName}<br /><span className="muted">{t.userPhone}</span></td>
                  <td>{t.type.replace('_', ' ')}</td>
                  <td className={Number(t.amount) < 0 ? 'amount-negative' : 'amount-positive'}>{formatCurrency(t.amount)}</td>
                  <td><span className={`status-badge status-${t.status.toLowerCase()}`}>{t.status}</span></td>
                  <td>{formatDate(t.createdAt)}</td>
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
