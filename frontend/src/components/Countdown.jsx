import { useEffect, useState } from 'react';

function formatRemaining(ms) {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Ticks once a second toward `target` - purely a display countdown, the
// actual reward crediting happens server-side on the daily cron job.
export default function Countdown({ target }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span>{formatRemaining(new Date(target).getTime() - now)}</span>;
}
