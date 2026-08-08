import { useEffect, useState } from 'react';

const ENDPOINT = '/.netlify/functions/gold-rate';

export function useGoldRate(enabled = true) {
  const [rates, setRates] = useState({ perTola24kPkr: null, perGram24kPkr: null });
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');
    fetch(ENDPOINT)
      .then((response) => {
        if (!response.ok) throw new Error('Gold rate unavailable');
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setRates({
          perTola24kPkr: Number(data.perTola24kPkr),
          perGram24kPkr: Number(data.perGram24kPkr),
        });
        setUpdatedAt(data.updatedAt || null);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { ...rates, status, updatedAt };
}
