import { useEffect, useMemo, useState } from 'react';
import { normalizeSymbol } from './psxLogos.js';

const ENDPOINT = '/.netlify/functions/psx-quotes';

export async function fetchPsxQuotes(symbols = []) {
  const list = [
    ...new Set(symbols.map(normalizeSymbol).filter((s) => s.length >= 2)),
  ];
  if (!list.length) return { updatedAt: null, data: {} };

  const url = `${ENDPOINT}?symbols=${encodeURIComponent(list.join(','))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load PSX prices');
  return res.json();
}

/** Shared quote loader for App (Investments sync) and Stocks tab. */
export function usePsxQuotes(symbols, { refreshKey = 0 } = {}) {
  const list = useMemo(
    () => [...new Set(symbols.map(normalizeSymbol).filter((s) => s.length >= 2))],
    [symbols.join(',')]
  );
  const [quotes, setQuotes] = useState({});
  const [status, setStatus] = useState('idle');
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    if (!list.length) {
      setQuotes({});
      setStatus('idle');
      setUpdatedAt(null);
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');

    fetchPsxQuotes(list)
      .then((res) => {
        if (cancelled) return;
        setQuotes(res.data || {});
        setUpdatedAt(res.updatedAt || null);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [list.join(','), refreshKey]);

  return { quotes, status, updatedAt, symbols: list };
}

export { normalizeSymbol };
