import { fmt, fmtPct } from '../storage.js';

export default function SummaryCards({ data, totals, onChange }) {
  const { invested, currentValue, profit, changePct } = totals;
  const yieldOnCost = invested > 0 ? (data.dividendReinvested / invested) * 100 : 0;
  const gainClass = profit >= 0 ? 'positive' : 'negative';

  return (
    <section className="summary-grid">
      <div className="card stat">
        <span className="stat-label">Overall Investment</span>
        <span className="stat-value">{fmt(invested)}</span>
      </div>
      <div className="card stat">
        <span className="stat-label">Total assets</span>
        <span className="stat-value">{fmt(currentValue)}</span>
      </div>
      <div className="card stat">
        <span className="stat-label">Profit / Loss</span>
        <span className={`stat-value ${gainClass}`}>
          {profit >= 0 ? '+' : ''}
          {fmt(profit)}
        </span>
        <span className={`stat-sub ${gainClass}`}>{fmtPct(changePct)}</span>
      </div>
      <div className="card stat">
        <span className="stat-label">Dividend Reinvested</span>
        <input
          className="stat-input"
          type="number"
          value={data.dividendReinvested}
          onChange={(e) =>
            onChange((prev) => ({
              ...prev,
              dividendReinvested: Number(e.target.value),
            }))
          }
        />
        <span className="stat-sub">Yield on cost {yieldOnCost.toFixed(2)}%</span>
      </div>
      <div className="card stat">
        <span className="stat-label">Start Date</span>
        <input
          className="stat-input"
          type="date"
          value={data.startDate}
          onChange={(e) =>
            onChange((prev) => ({
              ...prev,
              startDate: e.target.value,
            }))
          }
        />
      </div>
    </section>
  );
}
