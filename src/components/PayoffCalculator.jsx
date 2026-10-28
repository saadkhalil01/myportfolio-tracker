import MoneyInput from './MoneyInput.jsx';
import { fmt } from '../storage.js';
import { paymentDate, payoffPlan } from '../payoff.js';

const dateLabel = (date) => date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
const dateValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function PayoffCalculator({ total, settings, onSettingsChange }) {
  const monthly = settings?.monthly ?? 0;
  const startValue = settings?.startValue ?? dateValue(new Date());
  const setMonthly = (value) => onSettingsChange({ monthly: value, startValue });
  const setStartValue = (value) => onSettingsChange({ monthly, startValue: value });
  const start = new Date(`${startValue}T12:00:00`);
  const validDate = !Number.isNaN(start.getTime());
  const plan = validDate ? payoffPlan(total, monthly, start) : null;
  return (
    <div className="payoff-calculator">
      <div className="payoff-controls">
      <div className="payoff-heading">
        <h3>Payoff calculator</h3>
        <button type="button" className="btn btn-ghost" onClick={() => onSettingsChange(null)}>Clear</button>
      </div>
      <div className="payoff-inputs">
        <label>Value per month (PKR)
          <MoneyInput value={monthly} onChange={setMonthly} aria-label="Monthly repayment amount" placeholder="Enter monthly payment" />
        </label>
        <label>First payment date
          <input type="date" className="cell-input" value={startValue} onChange={(e) => setStartValue(e.target.value)} />
        </label>
      </div>
      {plan &&
        <div className="payoff-summary" aria-live="polite">
          <span>Paid off by <strong>{dateLabel(plan.end)}</strong></span>
          <span><strong>{plan.count}</strong> monthly payment{plan.count === 1 ? '' : 's'}</span>
          <span>Final payment <strong>PKR {fmt(plan.final)}</strong></span>
        </div>
      }
      {!plan && <p className="empty-note" role="status">{total <= 0 ? 'No outstanding liabilities to pay off.' : monthly > 0 ? 'Choose a valid date and an amount that pays off within 100 years.' : 'Enter a monthly amount to see your monthly schedule.'}</p>}
      <p className="card-note payoff-note">Estimate excludes interest, fees, and new debt. Planned payments only.</p>
      </div>
      {plan && <PaymentMonths start={start} plan={plan} monthly={monthly} />}
    </div>
  );
}

function PaymentMonths({ start, plan, monthly }) {
  return (
    <div className="payoff-months" role="list" aria-label="Monthly payment schedule">
      {Array.from({ length: plan.count }, (_, index) => {
        const date = paymentDate(start, index);
        const final = index === plan.count - 1;
        const amount = final ? plan.final : monthly;
        const remaining = final ? 0 : (plan.count - index - 2) * monthly + plan.final;
        return (
          <div key={index} role="listitem" className={`payoff-month${final ? ' is-final' : ''}`} title={`Payment on ${dateLabel(date)}`}>
            <div className="payoff-month-top">
              <time dateTime={dateValue(date)}>{date.toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}</time>
              <span className="payoff-month-number">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="payoff-month-amount"><span>PKR</span><strong>{fmt(amount)}</strong></div>
            <div className="payoff-month-bottom">
              {final ? <small className="payoff-badge">✓ Final payment</small> : <small>Remaining <b>{fmt(remaining)}</b></small>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
