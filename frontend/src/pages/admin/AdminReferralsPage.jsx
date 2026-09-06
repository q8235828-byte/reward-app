import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

export default function AdminReferralsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/referrals?page=${page}&pageSize=20`)
      .then((res) => { setItems(res.data.items); setPagination(res.data.pagination); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1>Referrals</h1>
      {error && <p className="form-error">{error}</p>}
      {loading ? <p>Loading…</p> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Referrer</th><th>Referred user</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>{r.referrerName}</td>
                  <td>{r.referredUserName}</td>
                  <td><span className={`status-badge status-${r.status.toLowerCase()}`}>{r.status.replace('_', ' ')}</span></td>
                  <td>{formatDate(r.createdAt)}</td>
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
