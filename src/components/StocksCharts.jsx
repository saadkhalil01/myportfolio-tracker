import { useMemo, useState } from 'react';
import { ChartCard } from './ChartsPanel.jsx';
import { normalizeSymbol } from '../psxQuotes.js';

const PALETTE = [
  '#28aa91',
  '#57b95f',
  '#7554be',
  '#f29125',
  '#e23e45',
  '#d84c9b',
  '#278fa2',
  '#78838c',
];

const CASH_COLOR = '#78838c';
const CASH_LABEL = 'Cash';

const DEFAULT_STYLES = {
  holdings: 'donut',
  portfolios: 'bar',
  pl: 'hbar',
};

function holdingCost(h) {
  return Number(h.avgBuy || 0) * Number(h.shares || 0);
}

function holdingValue(h, quotes) {
  const q = quotes[normalizeSymbol(h.name)];
  const cost = holdingCost(h);
  if (q?.price == null) return cost;
  return q.price * Number(h.shares || 0);
}

function portfolioIdleCash(p) {
  return Number(p.cash || 0);
}

function portfolioStockValue(p, quotes) {
  return (p.holdings || []).reduce((s, h) => s + holdingValue(h, quotes), 0);
}

function portfolioMarketValue(p, quotes) {
  return portfolioStockValue(p, quotes) + portfolioIdleCash(p);
}

/** Collapse many small stock slices; keep Cash as its own slice. */
function topWithOther(items, limit = 8) {
  const cash = items.find((d) => d.name === CASH_LABEL);
  const stocks = items.filter((d) => d.name !== CASH_LABEL);
  const budget = cash ? limit - 1 : limit;

  let trimmed = stocks;
  if (stocks.length > budget) {
    const top = stocks.slice(0, budget - 1);
    const rest = stocks.slice(budget - 1);
    const otherValue = rest.reduce((s, d) => s + Number(d.value || 0), 0);
    trimmed =
      otherValue > 0
        ? [...top, { name: 'Other', value: otherValue, color: '#94a3b8' }]
        : top;
  }

  return cash ? [...trimmed, cash] : trimmed;
}

export default function StocksCharts({ portfolios, quotes = {} }) {
  const [styles, setStyles] = useState(DEFAULT_STYLES);

  const { holdings, portfoliosData, pl, costVsMarket, stocksVsCash } = useMemo(() => {
    const bySym = new Map();
    const cash = portfolios.reduce((s, p) => s + portfolioIdleCash(p), 0);

    for (const p of portfolios) {
      for (const h of p.holdings || []) {
        const label = normalizeSymbol(h.name) || String(h.name || '').trim() || '—';
        if (!label || label === '—') continue;
        const cost = holdingCost(h);
        const value = holdingValue(h, quotes);
        const prev = bySym.get(label) || { name: label, value: 0, cost: 0, pl: 0 };
        prev.value += value;
        prev.cost += cost;
        prev.pl += value - cost;
        bySym.set(label, prev);
      }
    }

    const sortedHoldings = [...bySym.values()]
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((d, i) => ({
        name: d.name,
        value: d.value,
        color: PALETTE[i % PALETTE.length],
      }));

    if (cash > 0) {
      sortedHoldings.push({ name: CASH_LABEL, value: cash, color: CASH_COLOR });
    }

    const portfoliosData = portfolios
      .map((p, i) => ({
        name: p.name?.trim() || `Portfolio ${i + 1}`,
        value: portfolioMarketValue(p, quotes),
        color: PALETTE[i % PALETTE.length],
      }))
      .filter((d) => d.value > 0);

    const pl = [...bySym.values()]
      .filter((d) => d.cost > 0 || Math.abs(d.pl) > 0.5)
      .sort((a, b) => Math.abs(b.pl) - Math.abs(a.pl))
      .slice(0, 10)
      .map((d) => ({
        name: d.name,
        value: d.pl,
        color: d.pl >= 0 ? '#0d7a4f' : '#b42318',
      }));

    let totalCost = 0;
    let totalMarket = 0;
    for (const d of bySym.values()) {
      totalCost += d.cost;
      totalMarket += d.value;
    }

    // Cost includes idle cash (capital sitting in brokerage); market = stocks + cash
    const costVsMarket = [
      { name: 'Cost + cash', value: totalCost + cash, color: '#64748b' },
      { name: 'Market + cash', value: totalMarket + cash, color: '#1a56db' },
    ].filter((d) => d.value > 0);

    const stocksVsCash = [
      { name: 'Stocks', value: totalMarket, color: '#1a56db' },
      ...(cash > 0 ? [{ name: CASH_LABEL, value: cash, color: CASH_COLOR }] : []),
    ].filter((d) => d.value > 0);

    return {
      holdings: topWithOther(sortedHoldings),
      portfoliosData,
      pl,
      costVsMarket,
      stocksVsCash,
    };
  }, [portfolios, quotes]);

  const hasAny =
    holdings.length > 0 ||
    portfoliosData.length > 0 ||
    pl.length > 0 ||
    costVsMarket.length > 0 ||
    stocksVsCash.length > 0;

  if (!hasAny) return null;

  const setStyle = (key, value) => {
    setStyles((prev) => ({ ...prev, [key]: value }));
  };

  // Multi-portfolio: compare portfolios (each includes idle cash).
  // Single portfolio: stocks vs idle cash allocation.
  const showPortfolios = portfoliosData.length > 1;
  const middle = showPortfolios
    ? {
        title: 'By portfolio',
        chartId: 'stock-portfolios',
        data: portfoliosData,
        styleKey: 'portfolios',
        defaultStyle: styles.portfolios,
      }
    : {
        title: 'Stocks vs cash',
        chartId: 'stock-vs-cash',
        data: stocksVsCash.length ? stocksVsCash : costVsMarket,
        styleKey: 'portfolios',
        defaultStyle: styles.portfolios,
      };

  return (
    <section className="charts-grid stock-insight-charts" aria-label="Stocks insight charts">
      <ChartCard
        title="By holding"
        chartId="stock-holdings"
        data={holdings}
        style={styles.holdings}
        onStyleChange={(v) => setStyle('holdings', v)}
        className="nested-chart-card"
      />
      <ChartCard
        title={middle.title}
        chartId={middle.chartId}
        data={middle.data}
        style={middle.defaultStyle}
        onStyleChange={(v) => setStyle(middle.styleKey, v)}
        className="nested-chart-card"
      />
      <ChartCard
        title="Unrealized P/L"
        chartId="stock-pl"
        data={pl}
        style={styles.pl}
        onStyleChange={(v) => setStyle('pl', v)}
        className="nested-chart-card"
      />
    </section>
  );
}
