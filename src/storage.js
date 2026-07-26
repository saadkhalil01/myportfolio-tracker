const STORAGE_KEY = 'myportfolio-data-v1';

export const DEFAULT_DATA = {
  categories: [
    { id: 'emergency', name: 'Emergency Funds', invested: 182810, currentValue: 203952 },
    { id: 'stocks', name: 'Stocks', invested: 508719, currentValue: 515910 },
    { id: 'pension', name: 'Pension Fund', invested: 25000, currentValue: 31062 },
    { id: 'funds-equity', name: 'Funds (Equity)', invested: 0, currentValue: 0 },
    { id: 'crypto', name: 'Crypto', invested: 0, currentValue: 0 },
    { id: 'real-estate', name: 'Real Estate', invested: 0, currentValue: 0 },
    { id: 'bonds', name: 'Bonds', invested: 0, currentValue: 0 },
  ],
  liabilities: [
    { id: 'home-loan', name: 'Home Loan', amount: 1525000 },
    { id: 'phuppo', name: 'Phuppo', amount: 575000 },
    { id: 'mohsan', name: 'Mohsan', amount: 400000 },
    { id: 'hassan', name: 'Hassan', amount: 200000 },
    { id: 'aiza', name: 'Aiza', amount: 200000 },
    { id: 'tayyab', name: 'Tayyab', amount: 50000 },
    { id: 'ahnaf', name: 'Ahnaf', amount: 50000 },
    { id: 'soban', name: 'Soban', amount: 50000 },
  ],
  targets: [
    { id: 'car', name: 'Car', year: 2030, targetAmount: 0 },
    { id: 'house', name: 'House', year: 2035, targetAmount: 0 },
    { id: 'qurbani', name: 'Qurbani', year: 2027, targetAmount: 0 },
  ],
  dividendReinvested: 9975,
  startDate: '2023-12-23',
  chartStyles: {
    allocation: 'donut',
    net: 'donut',
    comparison: 'bar',
  },
  portfolios: [
    {
      id: 'monster-dividend',
      name: 'Monster Dividend',
      broker: 'Broker 1',
      strategy: 'dividend',
      goal: 'Sole goal: collect dividends and reinvest them',
      holdings: [],
    },
    {
      id: 'beast-growth',
      name: 'Beast Growth',
      broker: 'Broker 2',
      strategy: 'growth',
      goal: 'Growth-focused — dividends not required',
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

export function categoryTotals(categories = []) {
  const invested = categories.reduce((s, c) => s + Number(c.invested || 0), 0);
  const valuation = categories.reduce((s, c) => s + Number(c.currentValue || 0), 0);
  return { invested, valuation };
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
  const { invested, valuation } = categoryTotals(data.categories);
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
    holdings: Array.isArray(p.holdings) ? p.holdings.map(normalizeHolding) : [],
  };
}

function migrateData(parsed) {
  const base = structuredClone(DEFAULT_DATA);
  const merged = { ...base, ...parsed };

  let targets = Array.isArray(parsed.targets) ? parsed.targets.map(normalizeTarget) : base.targets;

  // Fold legacy "goals" (e.g. Qurbani) into targets if present
  if (Array.isArray(parsed.goals) && parsed.goals.length) {
    const existingIds = new Set(targets.map((t) => t.id));
    const existingNames = new Set(targets.map((t) => t.name.toLowerCase()));
    for (const g of parsed.goals) {
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
    ...(parsed.chartStyles || {}),
  };
  merged.portfolios = Array.isArray(parsed.portfolios)
    ? parsed.portfolios.map(normalizePortfolio)
    : base.portfolios;
  merged.valuationHistory = normalizeHistory(parsed.valuationHistory || []);
  return syncValuationHistory(merged);
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return syncValuationHistory(structuredClone(DEFAULT_DATA));
    return migrateData(JSON.parse(raw));
  } catch {
    return syncValuationHistory(structuredClone(DEFAULT_DATA));
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
