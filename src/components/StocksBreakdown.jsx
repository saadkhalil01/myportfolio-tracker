import { useMemo, useState } from 'react';
import { fmt, uid, numberInputValue } from '../storage.js';
import { normalizeSymbol } from '../psxQuotes.js';
import MoneyInput from './MoneyInput.jsx';
import StockLogo from './StockLogo.jsx';
import StocksCharts from './StocksCharts.jsx';

const STRATEGIES = [
  { id: 'dividend', label: 'Dividend' },
  { id: 'growth', label: 'Growth' },
  { id: 'mixed', label: 'Mixed' },
];

const SORT_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'shares', label: 'Shares' },
  { id: 'cost', label: 'Cost (amount)' },
  { id: 'value', label: 'Market value' },
  { id: 'pl', label: 'P/L' },
  { id: 'price', label: 'Price' },
  { id: 'avgBuy', label: 'Avg buy' },
];

const STOCK_COLORS = ['#28aa91', '#57b95f', '#7554be', '#f29125', '#e23e45', '#d84c9b', '#278fa2', '#78838c'];

function stockColor(holding) {
  if (/^#[0-9a-f]{6}$/i.test(String(holding?.customColor || ''))) return holding.customColor;
  const name = normalizeSymbol(holding?.name);
  const hash = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return STOCK_COLORS[hash % STOCK_COLORS.length];
}

const fmtPrice = (n, digits = 2) =>
  Number(n || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });

function holdingCost(h) {
  return Number(h.avgBuy || 0) * Number(h.shares || 0);
}

function StatIcon({ type }) {
  const paths = {
    portfolios: <><path d="M3 8h7l2 2h9v10H3z" /><path d="M3 8V5h7l2 2h7" /></>,
    stocks: <><path d="m4 17 5-5 4 3 7-9" /><path d="M15 6h5v5" /><path d="M4 21h16" /></>,
    cash: <><path d="M5 7h13a3 3 0 0 1 3 3v9H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12" /><path d="M16 11h5v5h-5a2.5 2.5 0 0 1 0-5z" /></>,
    value: <><path d="m4 17 5-5 4 3 7-9" /><path d="M15 6h5v5" /></>,
  };
  return <span className={`insight-stat-icon icon-${type}`}><svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg></span>;
}

function portfolioStockCost(p) {
  return (p.holdings || []).reduce((s, h) => s + holdingCost(h), 0);
}

function portfolioCash(p) {
  return Number(p.cash || 0);
}

function portfolioShares(p) {
  return (p.holdings || []).reduce((s, h) => s + Number(h.shares || 0), 0);
}

function holdingMetrics(h, quotes) {
  const sym = normalizeSymbol(h.name);
  const q = quotes[sym];
  const price = q?.price ?? null;
  const shares = Number(h.shares || 0);
  const cost = holdingCost(h);
  const value = price != null ? price * shares : cost;
  const pl = value - cost;
  return { sym, q, price, shares, cost, value, pl };
}

function sortHoldings(holdings, sortBy, sortDir, quotes) {
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...holdings].sort((a, b) => {
    const ma = holdingMetrics(a, quotes);
    const mb = holdingMetrics(b, quotes);
    let cmp = 0;
    switch (sortBy) {
      case 'shares':
        cmp = ma.shares - mb.shares;
        break;
      case 'cost':
        cmp = ma.cost - mb.cost;
        break;
      case 'value':
        cmp = ma.value - mb.value;
        break;
      case 'pl':
        cmp = ma.pl - mb.pl;
        break;
      case 'price':
        cmp = (ma.price ?? -Infinity) - (mb.price ?? -Infinity);
        break;
      case 'avgBuy':
        cmp = Number(a.avgBuy || 0) - Number(b.avgBuy || 0);
        break;
      case 'name':
      default:
        cmp = String(a.name || '').localeCompare(String(b.name || ''), undefined, {
          sensitivity: 'base',
        });
        break;
    }
    if (cmp === 0) {
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
        sensitivity: 'base',
      });
    }
    return cmp * dir;
  });
}

export default function StocksBreakdown({
  portfolios,
  onChange,
  quotes = {},
  quoteStatus = 'idle',
  quoteUpdatedAt = null,
  onRefreshQuotes,
}) {
  const [sortBy, setSortBy] = useState('value');
  const [sortDir, setSortDir] = useState('desc');

  const symbols = useMemo(
    () =>
      [
        ...new Set(
          portfolios
            .flatMap((p) => p.holdings || [])
            .map((h) => normalizeSymbol(h.name))
            .filter((s) => s.length >= 2)
        ),
      ],
    [portfolios]
  );

  const marketStats = useMemo(() => {
    let marketValue = 0;
    let costWithPrice = 0;
    let priced = 0;
    for (const p of portfolios) {
      for (const h of p.holdings || []) {
        const q = quotes[normalizeSymbol(h.name)];
        if (!q?.price) continue;
        const shares = Number(h.shares || 0);
        marketValue += q.price * shares;
        costWithPrice += holdingCost(h);
        priced += 1;
      }
    }
    return {
      marketValue,
      unrealized: marketValue - costWithPrice,
      priced,
    };
  }, [portfolios, quotes]);

  const totalPortfolios = portfolios.length;
  const totalHoldings = portfolios.reduce((s, p) => s + (p.holdings?.length || 0), 0);
  const totalStockCost = portfolios.reduce((s, p) => s + portfolioStockCost(p), 0);
  const totalCash = portfolios.reduce((s, p) => s + portfolioCash(p), 0);
  const totalShares = portfolios.reduce((s, p) => s + portfolioShares(p), 0);
  const totalDisplayValue =
    marketStats.priced > 0 ? marketStats.marketValue + totalCash : totalStockCost + totalCash;

  const updatePortfolio = (id, patch) => {
    onChange(portfolios.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const updateHolding = (portfolioId, holdingId, field, value) => {
    onChange(
      portfolios.map((p) => {
        if (p.id !== portfolioId) return p;
        return {
          ...p,
          holdings: p.holdings.map((h) =>
            h.id === holdingId ? { ...h, [field]: value } : h
          ),
        };
      })
    );
  };

  const addHolding = (portfolioId) => {
    onChange(
      portfolios.map((p) =>
        p.id === portfolioId
          ? {
              ...p,
              holdings: [...p.holdings, { id: uid(), name: '', avgBuy: 0, shares: 0 }],
            }
          : p
      )
    );
  };

  const removeHolding = (portfolioId, holdingId) => {
    onChange(
      portfolios.map((p) =>
        p.id === portfolioId
          ? { ...p, holdings: p.holdings.filter((h) => h.id !== holdingId) }
          : p
      )
    );
  };

  const addPortfolio = () => {
    onChange([
      ...portfolios,
      {
        id: uid(),
        name: 'New portfolio',
        broker: '',
        strategy: 'mixed',
        goal: '',
        cash: 0,
        holdings: [],
      },
    ]);
  };

  const removePortfolio = (id) => {
    if (!confirm('Remove this portfolio and all its stocks?')) return;
    onChange(portfolios.filter((p) => p.id !== id));
  };

  const quoteLabel =
    quoteStatus === 'loading'
      ? 'Updating prices…'
      : quoteStatus === 'error'
        ? 'Prices unavailable'
        : quoteUpdatedAt
          ? `PSX prices · ${new Date(quoteUpdatedAt).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : 'PSX prices';

  return (
    <section className="card insights-card">
      <div className="card-header">
        <div>
          <h2><span>Insights</span> <i /> Stocks breakdown</h2>
          <p className="card-note">
            Analyze your stock holdings, portfolio allocation and unrealized performance.
          </p>
        </div>
        <div className="card-header-actions">
          <span className={`quote-status quote-${quoteStatus}`}>{quoteLabel}</span>
          <label className="sort-control">
            <span className="sort-label">Sort</span>
            <select
              className="cell-input sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort holdings by"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-ghost sort-dir-btn"
              title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            >
              {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </label>
          <button
            type="button"
            className="btn btn-refresh"
            disabled={quoteStatus === 'loading' || !symbols.length}
            onClick={() => onRefreshQuotes?.()}
          >
            ↻&nbsp;&nbsp; Refresh prices
          </button>
          <button type="button" className="btn btn-add-portfolio" onClick={addPortfolio}>
            + Add portfolio
          </button>
        </div>
      </div>

      <div className="insight-stats">
        <div className="insight-stat">
          <StatIcon type="portfolios" />
          <div className="insight-stat-copy">
          <span className="stat-label">Portfolios</span>
          <span className="stat-value">{totalPortfolios}</span>
          </div>
        </div>
        <div className="insight-stat">
          <StatIcon type="stocks" />
          <div className="insight-stat-copy">
          <span className="stat-label">Stocks held</span>
          <span className="stat-value">{totalHoldings}</span>
          </div>
        </div>
        <div className="insight-stat">
          <StatIcon type="cash" />
          <div className="insight-stat-copy">
          <span className="stat-label">Cash</span>
          <span className="stat-value">{fmt(totalCash)}</span>
          <small>PKR</small>
          </div>
        </div>
        <div className="insight-stat insight-stat-primary">
          <StatIcon type="value" />
          <div className="insight-stat-copy">
          <span className="stat-label">Market value</span>
          <span className="stat-value">{fmt(totalDisplayValue)}</span>
          <small>PKR</small>
          <span
            className={`stat-sub ${
              marketStats.priced ? (marketStats.unrealized >= 0 ? 'positive' : 'negative') : ''
            }`}
          >
            {marketStats.priced
              ? `Unrealized ${marketStats.unrealized >= 0 ? '+' : ''}${fmt(marketStats.unrealized)} · ${fmtPrice(totalShares)} shares`
              : `Cost ${fmt(totalStockCost)} · ${fmtPrice(totalShares)} shares`}
          </span>
          </div>
        </div>
      </div>

      <StocksCharts portfolios={portfolios} quotes={quotes} />

      <div className="portfolio-grid">
        {portfolios.map((p) => {
          const stockCost = portfolioStockCost(p);
          const cash = portfolioCash(p);
          const shares = portfolioShares(p);

          let marketStocks = 0;
          let hasMarket = false;
          for (const h of p.holdings || []) {
            const q = quotes[normalizeSymbol(h.name)];
            if (q?.price != null) {
              marketStocks += q.price * Number(h.shares || 0);
              hasMarket = true;
            }
          }
          const portfolioMarket = (hasMarket ? marketStocks : stockCost) + cash;
          const portfolioGain = hasMarket ? marketStocks - stockCost : 0;

          return (
            <article key={p.id} className="portfolio-card">
              <div className="portfolio-card-head">
                <div className="portfolio-title-row">
                  <input
                    className="cell-input name portfolio-name"
                    value={p.name}
                    onChange={(e) => updatePortfolio(p.id, { name: e.target.value })}
                    placeholder="Portfolio name"
                  />
                  {portfolios.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon always-visible"
                      title="Remove portfolio"
                      onClick={() => removePortfolio(p.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="portfolio-meta-row">
                  <input
                    className="cell-input"
                    value={p.broker}
                    onChange={(e) => updatePortfolio(p.id, { broker: e.target.value })}
                    placeholder="Broker"
                  />
                  <select
                    className="cell-input"
                    value={p.strategy}
                    onChange={(e) => updatePortfolio(p.id, { strategy: e.target.value })}
                  >
                    {STRATEGIES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className="cell-input"
                  value={p.goal}
                  onChange={(e) => updatePortfolio(p.id, { goal: e.target.value })}
                  placeholder="Goal / notes"
                />
                <div className="portfolio-cash-row">
                  <label className="cash-label" htmlFor={`cash-${p.id}`}>
                    Cash
                  </label>
                  <MoneyInput
                    id={`cash-${p.id}`}
                    value={cash}
                    onChange={(value) => updatePortfolio(p.id, { cash: value })}
                    aria-label={`${p.name || 'Portfolio'} cash`}
                  />
                </div>
                <div className="portfolio-summary-line">
                  <span>Value {fmt(portfolioMarket)}</span>
                  <span>Cost {fmt(stockCost)}</span>
                  <span>Cash {fmt(cash)}</span>
                  <span>Shares {fmtPrice(shares, 0)}</span>
                  {hasMarket && (
                    <span className={portfolioGain >= 0 ? 'positive' : 'negative'}>
                      P/L {portfolioGain >= 0 ? '+' : ''}
                      {fmt(portfolioGain)}
                    </span>
                  )}
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table holdings-table">
                  <thead>
                    <tr>
                      <th>Stock</th>
                      <th className="num">Price</th>
                      <th className="num">Avg buy</th>
                      <th className="num">Shares</th>
                      <th className="num">Cost</th>
                      <th className="num">Value</th>
                      <th className="num">P/L</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.holdings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="empty-row">
                          No stocks yet — add your holdings below.
                        </td>
                      </tr>
                    ) : (
                      sortHoldings(p.holdings, sortBy, sortDir, quotes).map((h) => {
                        const { q, price, shares: sharesN, cost, value, pl } = holdingMetrics(
                          h,
                          quotes
                        );
                        const dayClass =
                          q?.change > 0 ? 'positive' : q?.change < 0 ? 'negative' : '';

                        return (
                          <tr
                            key={h.id}
                            className="category-row"
                            style={{ '--category-bg': stockColor(h) }}
                          >
                            <td>
                              <div className="stock-name-cell">
                                <label
                                  className="category-color-picker-wrap"
                                  title={`Choose color for ${h.name || 'stock'}`}
                                >
                                  <input
                                    className="category-color-picker"
                                    type="color"
                                    value={stockColor(h)}
                                    aria-label={`Choose color for ${h.name || 'stock'}`}
                                    onChange={(event) =>
                                      updateHolding(p.id, h.id, 'customColor', event.target.value)
                                    }
                                  />
                                </label>
                                <StockLogo name={h.name} />
                                <input
                                  className="cell-input name"
                                  value={h.name}
                                  onChange={(e) =>
                                    updateHolding(p.id, h.id, 'name', e.target.value)
                                  }
                                  placeholder="e.g. EFERT"
                                />
                              </div>
                            </td>
                            <td className="num price-cell">
                              {price != null ? (
                                <>
                                  <span className="price-main">{fmtPrice(price)}</span>
                                  {q.change != null && (
                                    <span className={`price-chg ${dayClass}`}>
                                      {q.change >= 0 ? '+' : ''}
                                      {fmtPrice(q.change)}
                                      {q.changePct != null
                                        ? ` (${q.changePct >= 0 ? '+' : ''}${fmtPrice(q.changePct)}%)`
                                        : ''}
                                    </span>
                                  )}
                                </>
                              ) : quoteStatus === 'loading' ? (
                                <span className="muted">…</span>
                              ) : (
                                <span className="muted">—</span>
                              )}
                            </td>
                            <td className="num">
                              <input
                                className="cell-input num"
                                type="number"
                                step="any"
                                value={h.avgBuy}
                                onChange={(e) =>
                                  updateHolding(p.id, h.id, 'avgBuy', numberInputValue(e.target.value))
                                }
                              />
                            </td>
                            <td className="num">
                              <input
                                className="cell-input num"
                                type="number"
                                step="any"
                                value={h.shares}
                                onChange={(e) =>
                                  updateHolding(p.id, h.id, 'shares', numberInputValue(e.target.value))
                                }
                              />
                            </td>
                            <td className="num">{fmt(cost)}</td>
                            <td className="num">
                              {price != null ? fmt(value) : '—'}
                            </td>
                            <td
                              className={`num ${
                                price == null ? '' : pl >= 0 ? 'positive' : 'negative'
                              }`}
                            >
                              {price == null
                                ? '—'
                                : `${pl >= 0 ? '+' : ''}${fmt(pl)}`}
                            </td>
                            <td className="row-actions">
                              <button
                                type="button"
                                className="btn-icon"
                                title="Remove stock"
                                onClick={() => removeHolding(p.id, h.id)}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className="btn btn-ghost small add-holding"
                onClick={() => addHolding(p.id)}
              >
                + Add stock
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
