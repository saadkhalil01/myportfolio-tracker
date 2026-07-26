const STORAGE_KEY_BASE = 'myportfolio-data-v1';

export function storageKeyForUser(userId) {
  return userId ? `${STORAGE_KEY_BASE}:${userId}` : STORAGE_KEY_BASE;
}

export const DEFAULT_DATA = {
  categories: [],
  liabilities: [],
  targets: [],
  dividendReinvested: 0,
  startDate: '2023-12-23',
  chartStyles: {
    allocation: 'donut',
    net: 'donut',
    comparison: 'bar',
  },
  portfolios: [
    {
      id: 'default',
      name: 'Default',
      broker: '',
      strategy: 'mixed',
      goal: '',
      cash: 0,
      holdings: [],
    },
  ],
  valuationHistory: [],
};

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Fresh empty template — all amounts 0, start date = today. */
export function createEmptyData() {
  const data = structuredClone(DEFAULT_DATA);
  data.startDate = todayISO();
  data.valuationHistory = [];
  return syncValuationHistory(data);
}

export function categoryTotals(categories = []) {
  const invested = categories.reduce((s, c) => s + Number(c.invested || 0), 0);
  const valuation = categories.reduce((s, c) => s + Number(c.currentValue || 0), 0);
  return { invested, valuation };
}

export function portfolioAssets(portfolios = []) {
  return portfolios.reduce((sum, p) => {
    const holdings = (p.holdings || []).reduce(
      (s, h) => s + Number(h.avgBuy || 0) * Number(h.shares || 0),
      0
    );
    return sum + holdings + Number(p.cash || 0);
  }, 0);
}

export function portfolioInvested(portfolios = []) {
  return portfolios.reduce(
    (sum, p) =>
      sum +
      (p.holdings || []).reduce((s, h) => s + Number(h.avgBuy || 0) * Number(h.shares || 0), 0),
    0
  );
}

/** Categories that duplicate the Stocks tab (same thing — don't count twice). */
export function isStocksCategory(c) {
  return c?.id === 'stocks' || /^stocks?$/i.test(String(c?.name || '').trim());
}

/**
 * Assets = non-stock investment categories + Stocks tab (holdings + cash as one).
 * Stocks tab is the single source for stocks — not mixed with a separate Stocks category.
 */
export function assetTotals(data = {}) {
  const categories = data.categories || [];
  const portfolios = data.portfolios || [];

  const otherCategories = categories.filter((c) => !isStocksCategory(c));
  const otherInvested = otherCategories.reduce((s, c) => s + Number(c.invested || 0), 0);
  const otherValue = otherCategories.reduce((s, c) => s + Number(c.currentValue || 0), 0);

  const stocksValue = portfolioAssets(portfolios);
  const stocksInvested = portfolioInvested(portfolios);

  return {
    invested: otherInvested + stocksInvested,
    valuation: otherValue + stocksValue,
    categoriesValue: otherValue,
    stocksValue,
  };
}

export function normalizeHistory(points = []) {
  const map = new Map();
  for (const p of points) {
    if (!p?.date) continue;
    map.set(p.date, {
      date: p.date,
      valuation: Number(p.valuation || 0),
      invested: Number(p.invested || 0),
    });
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Keep history seeded from start date and always refresh today's snapshot. */
export function syncValuationHistory(data) {
  const { invested, valuation } = assetTotals(data);
  const start = data.startDate || todayISO();
  const today = todayISO();
  let history = normalizeHistory(data.valuationHistory || []);

  if (history.length === 0) {
    history =
      start === today
        ? [{ date: today, valuation, invested }]
        : [
            { date: start, valuation: invested, invested },
            { date: today, valuation, invested },
          ];
  } else {
    if (!history.some((h) => h.date === start)) {
      history = normalizeHistory([
        { date: start, valuation: invested, invested },
        ...history,
      ]);
    }
    history = normalizeHistory([
      ...history.filter((h) => h.date !== today),
      { date: today, valuation, invested },
    ]);
  }

  const prev = JSON.stringify(normalizeHistory(data.valuationHistory || []));
  const next = JSON.stringify(history);
  if (prev === next) return data;
  return { ...data, valuationHistory: history };
}

function normalizeTarget(t) {
  return {
    id: t.id || Math.random().toString(36).slice(2, 10),
    name: t.name || 'Target',
    year: Number(t.year || new Date().getFullYear()),
    targetAmount: Number(t.targetAmount ?? t.amount ?? 0),
  };
}

function normalizeHolding(h) {
  return {
    id: h.id || Math.random().toString(36).slice(2, 10),
    name: h.name || '',
    avgBuy: Number(h.avgBuy ?? 0),
    shares: Number(h.shares ?? 0),
  };
}

function normalizePortfolio(p) {
  return {
    id: p.id || Math.random().toString(36).slice(2, 10),
    name: p.name || 'Portfolio',
    broker: p.broker || '',
    strategy: p.strategy || 'mixed',
    goal: p.goal || '',
    cash: Number(p.cash ?? 0),
    holdings: Array.isArray(p.holdings) ? p.holdings.map(normalizeHolding) : [],
  };
}

export function hydrateData(parsed) {
  const source = parsed || {};
  const base = structuredClone(DEFAULT_DATA);
  const merged = { ...base, ...source };

  let targets = Array.isArray(source.targets) ? source.targets.map(normalizeTarget) : base.targets;

  // Fold legacy "goals" (e.g. Qurbani) into targets if present
  if (Array.isArray(source.goals) && source.goals.length) {
    const existingIds = new Set(targets.map((t) => t.id));
    const existingNames = new Set(targets.map((t) => t.name.toLowerCase()));
    for (const g of source.goals) {
      const name = g.name || 'Goal';
      const yearMatch = String(name).match(/\b(20\d{2})\b/);
      const id = g.id || Math.random().toString(36).slice(2, 10);
      if (existingIds.has(id) || existingNames.has(name.toLowerCase())) continue;
      targets.push(
        normalizeTarget({
          id,
          name: name.replace(/\s*20\d{2}\s*/g, ' ').trim() || name,
          year: yearMatch ? Number(yearMatch[1]) : g.year,
          targetAmount: g.targetAmount ?? g.amount ?? 0,
        })
      );
    }
  }

  delete merged.goals;
  merged.targets = targets;
  merged.chartStyles = {
    ...base.chartStyles,
    ...(source.chartStyles || {}),
  };
  merged.portfolios = Array.isArray(source.portfolios)
    ? source.portfolios.map(normalizePortfolio)
    : base.portfolios;
  merged.valuationHistory = normalizeHistory(source.valuationHistory || []);
  return syncValuationHistory(merged);
}

export function loadData(userId) {
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId));
    if (!raw) return createEmptyData();
    return hydrateData(JSON.parse(raw));
  } catch {
    return createEmptyData();
  }
}

export function saveData(data, userId) {
  localStorage.setItem(storageKeyForUser(userId), JSON.stringify(data));
}

/** Wipe stored data and return a fresh empty snapshot (all amounts 0). */
export function resetData(userId) {
  localStorage.removeItem(storageKeyForUser(userId));
  return createEmptyData();
}

export function exportData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `myportfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmt = (n) =>
  Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

export const fmtPct = (n) =>
  `${n >= 0 ? '+' : ''}${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}%`;
