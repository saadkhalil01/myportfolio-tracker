import AppIcon from './AppIcon.jsx';
import MoneyInput from './MoneyInput.jsx';
import './PortfolioHeader.css';

export default function PortfolioHeader({ portfolio, cash, strategies, onUpdate, onRemove }) {
  const name = portfolio.name || 'Portfolio';
  return (
    <header className="portfolio-editor">
      <div className="portfolio-editor-identity">
        <span className="portfolio-editor-icon"><AppIcon name="portfolios" size={25} weight="fill" /></span>
        <div className="portfolio-editor-heading">
          <span className="portfolio-editor-eyebrow">Investment portfolio</span>
          <input className="portfolio-editor-name" value={portfolio.name}
            aria-label="Portfolio name" placeholder="Portfolio name"
            onChange={(e) => onUpdate({ name: e.target.value })} />
        </div>
      </div>
      <div className="portfolio-editor-fields">
        <label className="portfolio-editor-field">
          <span>Broker</span>
          <input value={portfolio.broker} placeholder="Add broker"
            onChange={(e) => onUpdate({ broker: e.target.value })} />
        </label>
        <label className="portfolio-editor-field">
          <span>Strategy</span>
          <select value={portfolio.strategy} onChange={(e) => onUpdate({ strategy: e.target.value })}>
            {strategies.map((strategy) => <option key={strategy.id} value={strategy.id}>{strategy.label}</option>)}
          </select>
        </label>
      </div>
      <label className="portfolio-editor-goal">
        <span>Goal</span>
        <input value={portfolio.goal} placeholder="Add a goal or note for this portfolio"
          onChange={(e) => onUpdate({ goal: e.target.value })} />
      </label>
      <div className="portfolio-editor-cash">
        <label htmlFor={`cash-${portfolio.id}`}><AppIcon name="cash" size={18} weight="fill" /> Available cash</label>
        <div className="portfolio-editor-amount">
          <span>PKR</span>
          <MoneyInput id={`cash-${portfolio.id}`} value={cash}
            onChange={(value) => onUpdate({ cash: value })} aria-label={`${name} cash`} />
        </div>
        <small>Ready to invest</small>
      </div>
      {onRemove && <button type="button" className="portfolio-editor-remove"
        aria-label={`Remove ${name}`} title="Remove portfolio" onClick={onRemove}>
        <AppIcon name="remove" size={18} weight="bold" />
      </button>}
    </header>
  );
}
