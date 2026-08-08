import { useMemo, useState } from 'react';
import { ChartCard } from './ChartsPanel.jsx';
import { normalizeSymbol } from '../psxQuotes.js';

const PALETTE = [
  '#1a56db',
  '#0d7a4f',
  '#7c3aed',
  '#b45309',
  '#be185d',
  '#0e7490',
  '#c2410c',
  '#64748b',
];

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

function portfolioMarketValue(p, quotes) {
  const stocks = (p.holdings || []).reduce((s, h) => s + holdingValue(h, quotes), 0);
  return stocks + Number(p.cash || 0);
}

/** Collapse many small holdings into an Other bucket for readable charts. */
function topWithOther(items, limit = 8) {
  if (items.length <= limit) return items;
  const top = items.slice(0, limit - 1);
  const rest = items.slice(limit - 1);
  const otherValue = rest.reduce((s, d) => s + Number(d.value || 0), 0);
  if (otherValue <= 0) return top;
  return [
    ...top,
    {
      name: 'Other',
      value: otherValue,
      color: '#94a3b8',
    },
  ];
}

export default function StocksCharts({ portfolios, quotes = {} }) {
  const [styles, setStyles] = useState(DEFAULT_STYLES);

  const { holdings, portfoliosData, pl, costVsMarket } = useMemo(() => {
    const bySym = new Map();

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
    const cash = portfolios.reduce((s, p) => s + Number(p.cash || 0), 0);
    const costVsMarket = [
      { name: 'Cost', value: totalCost, color: '#64748b' },
      { name: 'Market', value: totalMarket, color: '#1a56db' },
      ...(cash > 0 ? [{ name: 'Cash', value: cash, color: '#0e7490' }] : []),
    ].filter((d) => d.value > 0);

    return {
      holdings: topWithOther(sortedHoldings),
      portfoliosData,
      pl,
      costVsMarket,
    };
  }, [portfolios, quotes]);

  const hasAny =
    holdings.length > 0 || portfoliosData.length > 0 || pl.length > 0 || costVsMarket.length > 0;

  if (!hasAny) return null;

  const setStyle = (key, value) => {
    setStyles((prev) => ({ ...prev, [key]: value }));
  };

  // Prefer cost vs market when only one portfolio (portfolio chart is redundant)
  const showPortfolios = portfoliosData.length > 1;
  const third = showPortfolios
    ? {
        title: 'By portfolio',
        chartId: 'stock-portfolios',
        data: portfoliosData,
        styleKey: 'portfolios',
        defaultStyle: styles.portfolios,
      }
    : {
        title: 'Cost vs market',
        chartId: 'stock-cost-market',
        data: costVsMarket,
        styleKey: 'portfolios',
        defaultStyle: styles.portfolios === 'donut' ? 'bar' : styles.portfolios,
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
        title={third.title}
        chartId={third.chartId}
        data={third.data}
        style={third.defaultStyle}
        onStyleChange={(v) => setStyle(third.styleKey, v)}
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
