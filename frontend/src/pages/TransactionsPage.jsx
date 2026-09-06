import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Reward', value: 'REWARD' },
  { label: 'Referral', value: 'REFERRAL_COMMISSION' },
  { label: 'Withdrawal', value: 'WITHDRAWAL' },
  { label: 'Bonus', value: 'BONUS' },
  { label: 'Adjustment', value: 'ADJUSTMENT' },
];

export default function TransactionsPage() {
  const [items, setItems] = useState([]);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (type) query.set('type', type);
    api.get(`/transactions?${query.toString()}`)
      .then((res) => {
        setItems(res.data.items);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [type, page]);

  return (
    <div className="transactions-page">
      <Link to="/" className="back-link">← Dashboard</Link>
      <h1>Transactions</h1>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`filter-chip ${type === f.value ? 'active' : ''}`}
            onClick={() => { setType(f.value); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? <p>Loading…</p> : (
        <>
          {items.length === 0 && <p className="empty-state">No transactions yet.</p>}
          <ul className="history-list">
            {items.map((tx) => (
              <li key={tx.id} className="history-item">
                <span>{tx.type.replace('_', ' ')}</span>
                <span className={Number(tx.amount) < 0 ? 'amount-negative' : 'amount-positive'}>
                  {formatCurrency(tx.amount)}
                </span>
                <span className={`status-badge status-${tx.status.toLowerCase()}`}>{tx.status}</span>
                <span className="history-date">{formatDate(tx.createdAt)}</span>
              </li>
            ))}
          </ul>
          {pagination && pagination.totalPages > 1 && (
            <div className="pagination-row">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>{page} / {pagination.totalPages}</span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
