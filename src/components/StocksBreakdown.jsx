import { fmt, uid } from '../storage.js';

const STRATEGIES = [
  { id: 'dividend', label: 'Dividend' },
  { id: 'growth', label: 'Growth' },
  { id: 'mixed', label: 'Mixed' },
];

const fmtPrice = (n) =>
  Number(n || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

function holdingCost(h) {
  return Number(h.avgBuy || 0) * Number(h.shares || 0);
}

function portfolioCost(p) {
  return (p.holdings || []).reduce((s, h) => s + holdingCost(h), 0);
}

function portfolioShares(p) {
  return (p.holdings || []).reduce((s, h) => s + Number(h.shares || 0), 0);
}

export default function StocksBreakdown({ portfolios, onChange }) {
  const totalPortfolios = portfolios.length;
  const totalHoldings = portfolios.reduce((s, p) => s + (p.holdings?.length || 0), 0);
  const totalCost = portfolios.reduce((s, p) => s + portfolioCost(p), 0);
  const totalShares = portfolios.reduce((s, p) => s + portfolioShares(p), 0);

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
              holdings: [
                ...p.holdings,
                { id: uid(), name: '', avgBuy: 0, shares: 0 },
              ],
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
        holdings: [],
      },
    ]);
  };

  const removePortfolio = (id) => {
    if (!confirm('Remove this portfolio and all its stocks?')) return;
    onChange(portfolios.filter((p) => p.id !== id));
  };

  return (
    <section className="card insights-card">
      <div className="card-header">
        <div>
          <h2>Insights · Stocks breakdown</h2>
          <p className="card-note">
            Track each broker portfolio separately — holdings, average buy, and share count.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={addPortfolio}>
          + Add portfolio
        </button>
      </div>

      <div className="insight-stats">
        <div className="insight-stat">
          <span className="stat-label">Portfolios</span>
          <span className="stat-value">{totalPortfolios}</span>
        </div>
        <div className="insight-stat">
          <span className="stat-label">Stocks held</span>
          <span className="stat-value">{totalHoldings}</span>
        </div>
        <div className="insight-stat">
          <span className="stat-label">Total shares</span>
          <span className="stat-value">{fmtPrice(totalShares)}</span>
        </div>
        <div className="insight-stat">
          <span className="stat-label">Total cost basis</span>
          <span className="stat-value">{fmt(totalCost)}</span>
        </div>
      </div>

      <div className="portfolio-grid">
        {portfolios.map((p) => {
          const cost = portfolioCost(p);
          const shares = portfolioShares(p);
          return (
            <article key={p.id} className="portfolio-card">
              <div className="portfolio-head">
                <div className="portfolio-title-row">
                  <input
                    className="cell-input portfolio-name"
                    value={p.name}
                    onChange={(e) => updatePortfolio(p.id, { name: e.target.value })}
                    placeholder="Portfolio name"
                  />
                  <button
                    className="btn-icon always-visible"
                    title="Remove portfolio"
                    onClick={() => removePortfolio(p.id)}
                  >
                    ✕
                  </button>
                </div>
                <div className="portfolio-meta">
                  <input
                    className="cell-input"
                    value={p.broker}
                    onChange={(e) => updatePortfolio(p.id, { broker: e.target.value })}
                    placeholder="Broker account"
                  />
                  <select
                    className="strategy-select"
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
                  className="cell-input portfolio-goal"
                  value={p.goal}
                  onChange={(e) => updatePortfolio(p.id, { goal: e.target.value })}
                  placeholder="Goal / strategy note"
                />
                <div className="portfolio-summary">
                  <span>
                    {p.holdings.length} stock{p.holdings.length === 1 ? '' : 's'}
                  </span>
                  <span>{fmtPrice(shares)} shares</span>
                  <span>Cost {fmt(cost)}</span>
                </div>
              </div>

              <div className="table-scroll">
                <table className="data-table holdings-table">
                  <thead>
                    <tr>
                      <th>Stock</th>
                      <th className="num">Avg buy</th>
                      <th className="num">No. of shares</th>
                      <th className="num">Cost</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.holdings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-row">
                          No stocks yet — add your holdings below.
                        </td>
                      </tr>
                    ) : (
                      p.holdings.map((h) => (
                        <tr key={h.id}>
                          <td>
                            <input
                              className="cell-input name"
                              value={h.name}
                              onChange={(e) =>
                                updateHolding(p.id, h.id, 'name', e.target.value)
                              }
                              placeholder="e.g. ENGRO"
                            />
                          </td>
                          <td className="num">
                            <input
                              className="cell-input num"
                              type="number"
                              step="any"
                              value={h.avgBuy}
                              onChange={(e) =>
                                updateHolding(p.id, h.id, 'avgBuy', Number(e.target.value))
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
                                updateHolding(p.id, h.id, 'shares', Number(e.target.value))
                              }
                            />
                          </td>
                          <td className="num">{fmt(holdingCost(h))}</td>
                          <td className="row-actions">
                            <button
                              className="btn-icon"
                              title="Remove stock"
                              onClick={() => removeHolding(p.id, h.id)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <button className="btn btn-ghost small add-holding" onClick={() => addHolding(p.id)}>
                + Add stock
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
