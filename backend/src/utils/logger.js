// Deliberately minimal - Hostinger's Node.js log viewer just captures
// stdout/stderr, so a small structured-prefix wrapper is enough; no
// external logging library needed. Never pass password/secret values in
// `meta` (PMD section 55).
function safeMeta(meta) {
  if (!meta) return '';
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return '';
  }
}

function info(event, meta) {
  console.log(`[${new Date().toISOString()}] INFO ${event}${safeMeta(meta)}`);
}

function warn(event, meta) {
  console.warn(`[${new Date().toISOString()}] WARN ${event}${safeMeta(meta)}`);
}

function error(event, meta) {
  console.error(`[${new Date().toISOString()}] ERROR ${event}${safeMeta(meta)}`);
}

module.exports = { info, warn, error };
