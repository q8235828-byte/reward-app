// Normalizes Pakistani mobile numbers (accepting 03XXXXXXXXX, +923XXXXXXXXX,
// or 923XXXXXXXXX, with optional spaces/dashes) to the canonical 03XXXXXXXXX
// form used by JazzCash/Easypaisa. Returns null if the input isn't a valid
// Pakistani mobile number.
function normalizePhone(rawPhone) {
  const digits = rawPhone.replace(/\D/g, '');
  let normalized = digits;

  if (normalized.startsWith('92') && normalized.length === 12) {
    normalized = `0${normalized.slice(2)}`;
  }

  return /^03\d{9}$/.test(normalized) ? normalized : null;
}

module.exports = { normalizePhone };
