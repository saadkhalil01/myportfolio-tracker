import { fmt, uid } from '../storage.js';
import MoneyInput from './MoneyInput.jsx';

export default function Liabilities({ liabilities, onChange }) {
  const total = liabilities.reduce((s, l) => s + Number(l.amount || 0), 0);

  const update = (id, field, value) => {
    onChange(liabilities.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  return (
    <div className="card liabilities-card">
      <div className="card-header">
        <div>
          <h2>Liabilities</h2>
          <p className="card-note">People and loans you owe — amounts in PKR.</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => onChange([...liabilities, { id: uid(), name: 'New liability', amount: 0 }])}
        >
          + Add
        </button>
      </div>

      <ul className="item-list liabilities-list">
        {liabilities.map((l) => (
          <li key={l.id}>
            <input
              className="cell-input name liability-name"
              value={l.name}
              onChange={(e) => update(l.id, 'name', e.target.value)}
              placeholder="Name"
            />
            <MoneyInput
              value={l.amount}
              onChange={(amount) => update(l.id, 'amount', amount)}
              aria-label={`${l.name || 'Liability'} amount`}
            />
            <button
              className="btn-icon"
              title="Remove"
              onClick={() => onChange(liabilities.filter((x) => x.id !== l.id))}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="list-total liabilities-total">
        <span className="list-total-value negative">{fmt(total)}</span>
      </div>
    </div>
  );
}
