import { createEmptyData, hydrateData, portfolioInvested, stocksInsightsMarketValue, assetTotals, isStocksCategory, normalizeHistory, syncValuationHistory } from '../../../src/storage.js';
import { normalizeSymbol } from '../../../src/psxLogos.js';

export { normalizeSymbol };
export const emptyData = () => createEmptyData();
export const money = (value) => Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 });

export function normalizeData(source) {
  const normalized = hydrateData(source);
  return {
    ...source, ...normalized,
    ...(Array.isArray(source?.valuationHistory) && source.valuationHistory.length ? { valuationHistory: normalizeHistory(source.valuationHistory) } : {}),
    portfolios: normalized.portfolios.map((portfolio, index) => ({
      ...source?.portfolios?.[index], ...portfolio,
      holdings: portfolio.holdings.map((holding, i) => ({
        ...source?.portfolios?.[index]?.holdings?.[i], ...holding,
      })),
    })),
  };
}

export function totals(portfolios, quotes) {
  const invested = portfolioInvested(portfolios);
  const value = stocksInsightsMarketValue(portfolios, quotes);
  const cash = portfolios.reduce((sum, p) => sum + Number(p.cash || 0), 0);
  return { invested, value, cash, profit: value - invested };
}

export function holdingValues(holding, quotes) {
  const quote = quotes[normalizeSymbol(holding.name)];
  const live = Number.isFinite(quote?.price);
  const price = live ? quote.price : Number(holding.avgBuy || 0);
  const cost = Number(holding.avgBuy || 0) * Number(holding.shares || 0);
  const value = price * Number(holding.shares || 0);
  return { price, cost, value, profit: value - cost, live, changePct: quote?.changePct };
}

function amount(value, label, positive = false) {
  const number = Number(String(value).replace(/,/g, ''));
  if (String(value).trim() === '' || !Number.isFinite(number) || number < 0 || (positive && number === 0)) {
    throw new Error(`${label} must be ${positive ? 'greater than zero' : 'zero or more'}.`);
  }
  return number;
}

export function holdingInput(form) {
  const name = normalizeSymbol(form.name);
  if (name.length < 2 || name.length > 20) throw new Error('Enter a valid PSX symbol, for example EFERT.');
  return { name, shares: amount(form.shares, 'Shares', true), avgBuy: amount(form.avgBuy, 'Average buy price') };
}

export function portfolioInput(form) {
  const name = form.name.trim();
  if (!name) throw new Error('Enter a portfolio name.');
  return { name, broker: form.broker.trim(), cash: amount(form.cash, 'Available cash') };
}

export function editHolding(data, portfolioId, holdingId, values) {
  return { ...data, portfolios: data.portfolios.map((p) => p.id !== portfolioId ? p : {
    ...p, holdings: p.holdings.some((h) => h.id === holdingId)
      ? p.holdings.map((h) => h.id === holdingId ? { ...h, ...values } : h)
      : [...p.holdings, { id: holdingId, category: '', ...values }],
  }) };
}

export function editPortfolio(data, id, values) {
  const exists = data.portfolios.some((p) => p.id === id);
  return { ...data, portfolios: exists
    ? data.portfolios.map((p) => p.id === id ? { ...p, ...values } : p)
    : [...data.portfolios, { id, holdings: [], strategy: 'mixed', goal: '', ...values }],
  };
}

export const recordValuation = (data, quotes = {}) => syncValuationHistory(data, quotes);

export function wealth(data, quotes = {}) {
  const result = assetTotals(data, quotes);
  const liabilities = data.liabilities.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return { ...result, liabilities, net: result.valuation - liabilities, profit: result.valuation - result.invested };
}

export function assetAllocation(data, quotes = {}) {
  const result = assetTotals(data, quotes);
  const rows = data.categories.filter((category) => !isStocksCategory(category))
    .map((category) => ({ key: category.id, name: category.name, value: Number(category.currentValue || 0) }));
  if (result.stocksValue > 0) rows.push({ key: 'stocks', name: 'Stocks', value: result.stocksValue });
  return rows;
}

export function stockAllocation(data, quotes = {}) {
  return data.portfolios.flatMap((portfolio) => portfolio.holdings.map((holding) => ({
    key: `${portfolio.id}-${holding.id}`, name: normalizeSymbol(holding.name), value: holdingValues(holding, quotes).value,
  })));
}

export const recordFields = {
  categories: [['name', 'Investment name'], ['invested', 'Invested · PKR', true], ['currentValue', 'Current value · PKR', true]],
  liabilities: [['name', 'Liability name'], ['amount', 'Outstanding amount · PKR', true]],
  targets: [['name', 'Target name'], ['year', 'Target year', true], ['targetAmount', 'Target amount · PKR', true], ['buyMultiplier', 'Buy rule multiplier', true]],
};

export function recordInput(kind, form) {
  if (!recordFields[kind]) throw new Error('Unknown record type.');
  const values = {};
  for (const [key, label, numeric] of recordFields[kind]) {
    values[key] = numeric ? amount(form[key], label) : String(form[key] || '').trim();
    if (!numeric && !values[key]) throw new Error(`Enter ${label.toLowerCase()}.`);
  }
  if (kind === 'targets') {
    if (!Number.isInteger(values.year) || values.year < 1900 || values.year > 9999) throw new Error('Enter a valid four-digit year.');
    if (!Number.isInteger(values.buyMultiplier) || values.buyMultiplier < 1) throw new Error('Buy multiplier must be a whole number of at least 1.');
  }
  return values;
}

export function editRecord(data, kind, id, values) {
  if (!recordFields[kind]) throw new Error('Unknown record type.');
  const rows = data[kind];
  return { ...data, [kind]: rows.some((row) => row.id === id)
    ? rows.map((row) => row.id === id ? { ...row, ...values } : row)
    : [...rows, { id, ...values }] };
}

export function parseBackup(text) {
  const source = JSON.parse(text);
  if (!source || typeof source !== 'object' || Array.isArray(source)
    || !['portfolios', 'categories', 'liabilities', 'targets'].some((key) => Array.isArray(source[key]))) {
    throw new Error('Paste a MyPortfolio JSON backup.');
  }
  for (const key of ['portfolios', 'categories', 'liabilities', 'targets']) {
    if (source[key] !== undefined && (!Array.isArray(source[key]) || source[key].some((row) => !row || typeof row !== 'object'))) {
      throw new Error(`Invalid ${key} in backup.`);
    }
  }
  for (const portfolio of source.portfolios || []) {
    if (portfolio.holdings !== undefined && (!Array.isArray(portfolio.holdings)
      || portfolio.holdings.some((holding) => !holding || typeof holding !== 'object'))) throw new Error('Invalid holdings in backup.');
  }
  if (source.valuationHistory !== undefined && (!Array.isArray(source.valuationHistory)
    || source.valuationHistory.some((point) => !point || !/^\d{4}-\d{2}-\d{2}$/.test(point.date)
      || !Number.isFinite(Number(point.valuation)) || !Number.isFinite(Number(point.invested))))) {
    throw new Error('Invalid valuation history in backup.');
  }
  const data = normalizeData(source);
  for (const kind of Object.keys(recordFields)) data[kind].forEach((row) => recordInput(kind, row));
  for (const portfolio of data.portfolios) {
    portfolioInput(portfolio);
    portfolio.holdings.forEach(holdingInput);
  }
  return data;
}

export function targetFunds(data, quotes) {
  const categories = data.categories.filter((c) => c.id !== 'pension' && !/pension/i.test(c.name || ''));
  return Math.max(0, assetTotals({ ...data, categories }, quotes).valuation);
}
