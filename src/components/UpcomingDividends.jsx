import { fmt, numberInputValue, todayISO } from '../storage.js';
import { upcomingDividendEntries } from '../stockDividends.js';
import { stockColor } from '../stockColors.js';
import StockLogo from './StockLogo.jsx';

function HoldingIdentity({ holding, portfolio }) {
  return (
    <div className="dividend-holding">
      <StockLogo name={holding.name} category={holding.category} color={stockColor(holding)} />
      <div><strong>{holding.name}</strong><small>{portfolio.name}</small></div>
    </div>
  );
}

function DividendEditor({ holding, portfolio, onUpdateHolding }) {
  const dividend = holding.upcomingDividend || {};
  const update = (patch) => onUpdateHolding(portfolio.id, holding.id, 'upcomingDividend', {
    ...dividend, ...patch,
  });
  return (
    <div className="dividend-editor">
      <HoldingIdentity holding={holding} portfolio={portfolio} />
      <label>Payment date
        <input className="cell-input" type="date" value={dividend.paymentDate || ''}
          aria-label={`Dividend payment date for ${holding.name} in ${portfolio.name}`}
          onChange={(event) => update({ paymentDate: event.target.value })} />
      </label>
      <label>PKR per share
        <input className="cell-input" type="number" min="0" step="any" value={dividend.perShare ?? ''}
          aria-label={`Dividend per share for ${holding.name} in ${portfolio.name}`}
          onChange={(event) => update({ perShare: numberInputValue(event.target.value) })} />
      </label>
      <button type="button" className="btn btn-ghost small"
        disabled={!dividend.paymentDate && !dividend.perShare}
        aria-label={`Clear upcoming dividend for ${holding.name} in ${portfolio.name}`}
        onClick={() => onUpdateHolding(portfolio.id, holding.id, 'upcomingDividend', null)}>Clear</button>
    </div>
  );
}

function DividendCard({ entry }) {
  const date = new Date(`${entry.paymentDate}T12:00:00`).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  return (
    <article className="dividend-summary" style={{ '--dividend-color': stockColor(entry.holding) }}>
      <HoldingIdentity holding={entry.holding} portfolio={entry.portfolio} />
      <time dateTime={entry.paymentDate}>{date}</time>
      <strong>{fmt(entry.expectedAmount)} PKR</strong>
      <small>{fmt(entry.perShare)} PKR × {Number(entry.holding.shares).toLocaleString('en-PK')} shares</small>
    </article>
  );
}

export default function UpcomingDividends({ portfolios, onUpdateHolding }) {
  const holdings = portfolios.flatMap((portfolio) => (portfolio.holdings || [])
    .filter((holding) => holding.name?.trim()).map((holding) => ({ portfolio, holding })));
  const entries = upcomingDividendEntries(portfolios, todayISO());
  const total = entries.reduce((sum, entry) => sum + entry.expectedAmount, 0);
  return (
    <section className="card upcoming-dividends" aria-label="Upcoming stock dividends">
      <div className="card-header dividend-header">
        <h2>Upcoming dividends</h2><strong>Expected gross: {fmt(total)} PKR</strong>
      </div>
      <p className="muted">Track the next announced payment for each holding. Amounts use your current shares.</p>
      {entries.length ? <div className="dividend-grid">
        {entries.map((entry) => <DividendCard key={`${entry.portfolio.id}:${entry.holding.id}`} entry={entry} />)}
      </div> : <p className="empty-note">No upcoming dividends scheduled.</p>}
      <details className="dividend-management">
        <summary>Manage dividend dates and amounts</summary>
        {holdings.length ? holdings.map(({ portfolio, holding }) => (
          <DividendEditor key={`${portfolio.id}:${holding.id}`} portfolio={portfolio}
            holding={holding} onUpdateHolding={onUpdateHolding} />
        )) : <p className="empty-note">Add a named stock holding to schedule a dividend.</p>}
      </details>
    </section>
  );
}
