export function formatCurrency(value) {
  const number = Number(value || 0);
  return `Rs. ${number.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
