import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { API_URL } from '../lib/config';
import { normalizeSymbol } from '../lib/model.mjs';

export function useQuotes(portfolios = []) {
  const symbols = [...new Set(portfolios.flatMap((p) => p.holdings.map((h) => normalizeSymbol(h.name))).filter(Boolean))].sort().join(',');
  const request = useRef(null);
  const [state, setState] = useState({ quotes: {}, loading: false, error: '', updatedAt: null });
  const refresh = useCallback(async () => {
    request.current?.abort();
    if (!symbols) { setState({ quotes: {}, loading: false, error: '', updatedAt: null }); return; }
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const response = await fetch(`${API_URL}/.netlify/functions/psx-quotes?symbols=${encodeURIComponent(symbols)}`, { signal: controller.signal });
      if (!response.ok) throw new Error('PSX prices are unavailable. Pull down to retry.');
      const result = await response.json();
      if (request.current !== controller) return;
      const quotes = Object.fromEntries(Object.entries(result.data || {}).filter(([, quote]) => Number.isFinite(quote?.price)));
      const missing = symbols.split(',').some((symbol) => !quotes[symbol]);
      setState((prev) => ({ quotes: { ...prev.quotes, ...quotes }, loading: false, updatedAt: result.updatedAt,
        error: missing ? 'Some prices are unavailable. Previous prices or average buy prices are shown.' : '' }));
    } catch (problem) {
      if (request.current === controller) setState((prev) => ({ ...prev, loading: false,
        error: problem.name === 'AbortError' ? 'PSX request timed out. Pull down to retry.' : problem.message }));
    } finally { clearTimeout(timeout); }
  }, [symbols]);
  useEffect(() => {
    refresh();
    const timer = setInterval(() => { if (AppState.currentState === 'active') refresh(); }, 60000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); listener.remove(); request.current?.abort(); request.current = null; };
  }, [refresh]);
  return { ...state, refresh };
}
