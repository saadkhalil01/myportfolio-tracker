import { fmt, uid } from '../storage.js';

export default function Liabilities({ liabilities, onChange }) {
  const total = liabilities.reduce((s, l) => s + Number(l.amount || 0), 0);

  const update = (id, field, value) => {
    onChange(liabilities.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Liabilities</h2>
        <button
          className="btn btn-ghost"
          onClick={() => onChange([...liabilities, { id: uid(), name: 'New liability', amount: 0 }])}
        >
          + Add
        </button>
      </div>
      <ul className="item-list">
        {liabilities.map((l) => (
          <li key={l.id}>
            <input
              className="cell-input name"
              value={l.name}
              onChange={(e) => update(l.id, 'name', e.target.value)}
            />
            <input
              className="cell-input num"
              type="number"
              value={l.amount}
              onChange={(e) => update(l.id, 'amount', Number(e.target.value))}
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
      <div className="list-total">
        <span>Total</span>
        <span className="negative">{fmt(total)}</span>
      </div>
    </div>
  );
}
