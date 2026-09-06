export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="pagination-row">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span>{page} / {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}
