import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import { formatCurrency } from '../../utils/format';

export default function AdminRewardsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/rewards?page=${page}&pageSize=20`)
      .then((res) => { setItems(res.data.items); setPagination(res.data.pagination); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1>Rewards</h1>
      {error && <p className="form-error">{error}</p>}
      {loading ? <p>Loading…</p> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>User</th><th>Plan</th><th>Reward date</th><th>Eligible amount</th><th>Rate</th><th>Reward</th></tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>{r.userFullName}<br /><span className="muted">{r.userPhone}</span></td>
                  <td>#{r.userPlanId}</td>
                  <td>{r.rewardDate}</td>
                  <td>{formatCurrency(r.eligibleAmount)}</td>
                  <td>{Number(r.rewardRate)}%</td>
                  <td>{formatCurrency(r.rewardAmount)}</td>
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
