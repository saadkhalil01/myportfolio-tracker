const STORAGE_KEY_BASE = 'myportfolio-data-v1';

/** Preserve a blank numeric field while the user is editing it. */
export function numberInputValue(raw) {
  return raw === '' ? '' : Number(raw);
}

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
  /** Set after avgBuy/shares were corrected — do not swap again. */
  holdingFieldsFixed: true,
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

/** Cost basis of holdings + cash in brokerage (cash is capital you put in). */
export function portfolioInvested(portfolios = []) {
  return portfolios.reduce((sum, p) => {
    const holdings = (p.holdings || []).reduce(
      (s, h) => s + Number(h.avgBuy || 0) * Number(h.shares || 0),
      0
    );
    return sum + holdings + Number(p.cash || 0);
  }, 0);
}

/** Categories that duplicate the Stocks tab (same thing — don't count twice). */
export function isStocksCategory(c) {
  return c?.id === 'stocks' || /^stocks?$/i.test(String(c?.name || '').trim());
}

export function isGoldCategory(c) {
  return /^gold$/i.test(String(c?.name || '').trim());
}

export function syncGoldCategoriesFromRate(data, rates = {}) {
  const perTola = Number(rates.perTola24kPkr);
  const perGram = Number(rates.perGram24kPkr);
  if (!Number.isFinite(perTola) || !Number.isFinite(perGram) || perTola <= 0 || perGram <= 0) {
    return data;
  }

  let changed = false;
  const categories = (data.categories || []).map((category) => {
    if (!isGoldCategory(category)) return category;
    const goldUnit = category.goldUnit === 'gram' ? 'gram' : 'tola';
    const parsedQuantity = Number(category.goldQuantity ?? category.goldTolas ?? 1);
    const goldQuantity = Number.isFinite(parsedQuantity) && parsedQuantity >= 0 ? parsedQuantity : 1;
    const unitRate = goldUnit === 'gram' ? perGram : perTola;
    // goldQuantity is the only editable holding state; invested PKR tracks live value
    const currentValue = Math.round(Math.max(0, goldQuantity) * unitRate);
    const invested = currentValue;
    if (
      Number(category.currentValue || 0) === currentValue &&
      Number(category.invested || 0) === invested &&
      Number(category.goldQuantity) === goldQuantity &&
      category.goldUnit === goldUnit &&
      category.goldInvestedAuto === true
    ) {
      return category;
    }
    changed = true;
    const { goldTolas: _legacyGoldTolas, ...rest } = category;
    return {
      ...rest,
      goldQuantity,
      goldUnit,
      goldInvestedAuto: true,
      invested,
      currentValue,
    };
  });
  return changed ? { ...data, categories } : data;
}

function holdingSymbol(name = '') {
  return String(name)
    .trim()
    .toUpperCase()
    .replace(/\.PK$/i, '')
    .replace(/[^A-Z0-9]/g, '');
}

/** True when Stocks insights has cash or any holding rows. */
export function hasStocksInsights(portfolios = []) {
  return (portfolios || []).some((p) => {
    if (Number(p.cash || 0) > 0) return true;
    return (p.holdings || []).some(
      (h) =>
        String(h.name || '').trim() ||
        Number(h.shares || 0) > 0 ||
        Number(h.avgBuy || 0) > 0
    );
  });
}

/**
 * Stocks insights market total: live price × shares when available, else cost,
 * plus portfolio cash.
 */
export function stocksInsightsMarketValue(portfolios = [], quotes = {}) {
  let total = 0;
  for (const p of portfolios || []) {
    total += Number(p.cash || 0);
    for (const h of p.holdings || []) {
      const shares = Number(h.shares || 0);
      const sym = holdingSymbol(h.name);
      const live = quotes?.[sym]?.price;
      if (live != null && shares) total += Number(live) * shares;
      else total += Number(h.avgBuy || 0) * shares;
    }
  }
  return total;
}

/**
 * Keep Investments "Stock/Stocks" current value in sync with Stocks insights total.
 */
export function syncStocksCategoryFromInsights(data, quotes = {}) {
  const portfolios = data.portfolios || [];
  if (!hasStocksInsights(portfolios)) return data;

  const categories = data.categories || [];
  const idx = categories.findIndex(isStocksCategory);
  if (idx < 0) return data;

  const currentValue = Math.round(stocksInsightsMarketValue(portfolios, quotes));
  if (Number(categories[idx].currentValue || 0) === currentValue) return data;

  return {
    ...data,
    categories: categories.map((c, i) => (i === idx ? { ...c, currentValue } : c)),
  };
}

/**
 * Invested from Investments tab categories.
 * Stock current value comes from Stocks insights when insights exist.
 */
export function assetTotals(data = {}, quotes = {}) {
  const categories = data.categories || [];
  const portfolios = data.portfolios || [];

  const otherCategories = categories.filter((c) => !isStocksCategory(c));
  const stockCategory = categories.find(isStocksCategory);

  const otherInvested = otherCategories.reduce((s, c) => s + Number(c.invested || 0), 0);
  const otherValue = otherCategories.reduce((s, c) => s + Number(c.currentValue || 0), 0);
  const stockInvested = Number(stockCategory?.invested || 0);

  const insights = hasStocksInsights(portfolios);
  const insightsValue = insights ? stocksInsightsMarketValue(portfolios, quotes) : 0;
  const insightsInvested = insights ? portfolioInvested(portfolios) : 0;

  if (insights) {
    const invested = otherInvested + (stockCategory ? stockInvested : insightsInvested);
    const valuation = otherValue + insightsValue;
    return {
      invested,
      valuation,
      categoriesValue: otherValue + insightsValue,
      stocksValue: insightsValue,
      stocksFromInsights: true,
    };
  }

  const stockValue = Number(stockCategory?.currentValue || 0);
  return {
    invested: otherInvested + stockInvested,
    valuation: otherValue + stockValue,
    categoriesValue: otherValue + stockValue,
    stocksValue: stockValue,
    stocksFromInsights: false,
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

/** Same stats shown on Growth tab — use these on Overview too. */
export function growthStats(history = []) {
  const series = normalizeHistory(history);
  if (!series.length) {
    return { start: 0, end: 0, change: 0, changePct: 0, high: 0, low: 0, up: true };
  }
  const start = series[0].valuation;
  const end = series[series.length - 1].valuation;
  const change = end - start;
  const changePct = start > 0 ? (change / start) * 100 : 0;
  const vals = series.map((p) => p.valuation);
  return {
    start,
    end,
    change,
    changePct,
    high: Math.max(...vals),
    low: Math.min(...vals),
    up: change >= 0,
  };
}

/** Merge history points by date, keeping the higher valuation/invested. */
export function mergeHistories(...lists) {
  const map = new Map();
  for (const list of lists) {
    for (const p of normalizeHistory(list || [])) {
      const prev = map.get(p.date);
      if (!prev) {
        map.set(p.date, p);
      } else {
        map.set(p.date, {
          date: p.date,
          valuation: Math.max(prev.valuation, p.valuation),
          invested: Math.max(prev.invested, p.invested),
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Pick the richest snapshot across guest/local/cloud so a stale cloud row
 * cannot wipe cash/holdings that still exist in another copy.
 */
export function pickRicherData(...sources) {
  // Hydrate each source first so avgBuy/shares migration runs at most once per copy
  const valid = sources.filter(Boolean).map((s) => hydrateData(s));
  if (!valid.length) return createEmptyData();

  let best = valid[0];
  for (const s of valid) {
    if (assetTotals(s).invested > assetTotals(best).invested) best = s;
  }

  let bestPorts = best.portfolios || [];
  for (const s of valid) {
    if (portfolioInvested(s.portfolios || []) > portfolioInvested(bestPorts)) {
      bestPorts = s.portfolios;
    }
  }

  const valuationHistory = mergeHistories(...valid.map((s) => s.valuationHistory));
  return hydrateData({
    ...best,
    portfolios: bestPorts,
    valuationHistory,
    holdingFieldsFixed: true,
  });
}

/** Keep history seeded from start date and always refresh today's snapshot. */
export function syncValuationHistory(data, quotes = {}) {
  const { invested, valuation } = assetTotals(data, quotes);
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
    // Missing start date: copy earliest known values — never invent a lower start from today's cost basis
    if (!history.some((h) => h.date === start) && start <= history[0].date) {
      const earliest = history[0];
      history = normalizeHistory([
        {
          date: start,
          valuation: earliest.valuation,
          invested: earliest.invested || invested,
        },
        ...history,
      ]);
    }
    const existingToday = history.find((h) => h.date === today);
    history = normalizeHistory([
      ...history.filter((h) => h.date !== today),
      {
        date: today,
        valuation,
        // Don't let a transient under-count shrink invested on today's point
        invested: Math.max(invested, Number(existingToday?.invested || 0)),
      },
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

function normalizeHolding(h, { swapAvgAndShares = false } = {}) {
  const avgBuy = Number(h.avgBuy ?? 0);
  const shares = Number(h.shares ?? 0);
  return {
    id: h.id || Math.random().toString(36).slice(2, 10),
    name: h.name || '',
    avgBuy: swapAvgAndShares ? shares : avgBuy,
    shares: swapAvgAndShares ? avgBuy : shares,
  };
}

function normalizePortfolio(p, options = {}) {
  return {
    id: p.id || Math.random().toString(36).slice(2, 10),
    name: p.name || 'Portfolio',
    broker: p.broker || '',
    strategy: p.strategy || 'mixed',
    goal: p.goal || '',
    cash: Number(p.cash ?? 0),
    holdings: Array.isArray(p.holdings)
      ? p.holdings.map((h) => normalizeHolding(h, options))
      : [],
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

  // Older saves had avg buy and share count stored in each other's fields.
  const alreadyFixed = Boolean(source.holdingFieldsFixed);
  const rawPortfolios = Array.isArray(source.portfolios) ? source.portfolios : null;
  const hasHoldings = Boolean(
    rawPortfolios?.some((p) => Array.isArray(p.holdings) && p.holdings.length)
  );
  const swapAvgAndShares = !alreadyFixed && hasHoldings;

  merged.portfolios = rawPortfolios
    ? rawPortfolios.map((p) => normalizePortfolio(p, { swapAvgAndShares }))
    : base.portfolios;
  merged.holdingFieldsFixed = true;
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
