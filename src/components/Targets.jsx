import { fmt, uid, numberInputValue } from '../storage.js';
import { normalizeBuyMultiplier } from '../targetRules.js';
import AppIcon from './AppIcon.jsx';

function TargetRow({ target: t, availableFunds, update, remove }) {
  const multiplier = normalizeBuyMultiplier(t.buyMultiplier);
  const required = Number(t.targetAmount || 0) * multiplier;
  const available = Math.max(0, Number(availableFunds) || 0);
  const ableToBuy = required > 0 && available >= required;
  const pct = required > 0 ? Math.min(100, available / required * 100) : 0;
  const remaining = Math.max(0, required - available);

  return (
    <tr>
      <td>
        <input className="cell-input name" value={t.name}
          aria-label="Target name" onChange={(e) => update(t.id, 'name', e.target.value)} />
      </td>
      <td className="num">
        <input className="cell-input num year" type="number" value={t.year}
          aria-label={`${t.name} year`}
          onChange={(e) => update(t.id, 'year', numberInputValue(e.target.value))} />
      </td>
      <td className="num">
        <input className="cell-input num" type="number" value={t.targetAmount}
          aria-label={`${t.name} target amount`}
          onChange={(e) => update(t.id, 'targetAmount', numberInputValue(e.target.value))} />
      </td>
      <td className="center">
        <label className="buy-rule">
          <input className="cell-input num" type="number" min="1" step="1"
            aria-label={`${t.name} buy rule multiplier`}
            value={t.buyMultiplier ?? 1}
            onChange={(e) => update(t.id, 'buyMultiplier', e.target.value === '' ? '' : normalizeBuyMultiplier(e.target.value))}
            onBlur={() => update(t.id, 'buyMultiplier', multiplier)} />
          <span>×</span>
        </label>
      </td>
      <td className="center able-cell">
        {ableToBuy ? (
          <span className="able-tick" title={`Able to buy ${multiplier} times`}
            aria-label={`Able to buy ${multiplier} times`}>✓</span>
        ) : <span className="able-empty" aria-label="Not yet">—</span>}
      </td>
      <td className="num progress-cell">
        <div className="progress-meta">
          <span className={ableToBuy ? 'positive' : ''}>{pct.toFixed(0)}%</span>
          {remaining > 0 && <span className="progress-remaining">{fmt(remaining)} left</span>}
        </div>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-remaining">{fmt(required)} needed ({multiplier}×)</span>
      </td>
      <td className="row-actions">
        <button className="btn-icon" title="Remove" onClick={() => remove(t.id)}>
          <AppIcon name="remove" size={16} />
        </button>
      </td>
    </tr>
  );
}

export default function Targets({ targets, availableFunds, onChange }) {
  const update = (id, field, value) => {
    onChange(targets.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const addRow = () => {
    onChange([
      ...targets,
      {
        id: uid(),
        name: 'New target',
        year: new Date().getFullYear() + 1,
        targetAmount: 0,
        buyMultiplier: 4,
      },
    ]);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Targets</h2>
          <p className="card-note">
            Able to buy uses savings & investments excluding pension ({fmt(availableFunds)}). Set each buy rule: 4× for four times the price, 1× for a car or home.
          </p>
        </div>
        <button className="btn btn-ghost btn-add" onClick={addRow}>
          <AppIcon name="add" size={18} /> Add
        </button>
      </div>
      {targets.length === 0 ? (
        <p className="empty-note">No targets yet — use + Add to create one.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table targets-table">
            <thead>
              <tr>
                <th>Target</th>
                <th className="num">Year</th>
                <th className="num">Target amount</th>
                <th className="center">Buy rule</th>
                <th className="center">Able to buy</th>
                <th className="num">Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <TargetRow key={t.id} target={t} availableFunds={availableFunds} update={update}
                  remove={(id) => onChange(targets.filter((x) => x.id !== id))} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
