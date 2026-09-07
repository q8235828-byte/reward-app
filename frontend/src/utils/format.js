export function formatCurrency(value) {
  const number = Number(value || 0);
  return `Rs. ${number.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// Forces the Asia/Karachi timezone regardless of the viewer's own device
// timezone - used where the UI explicitly labels a time as "(Pakistan
// Time)" (next reward time on WithdrawPage), so the label stays accurate.
export function formatPakistanTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
