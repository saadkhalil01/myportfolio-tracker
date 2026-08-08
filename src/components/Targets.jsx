import { fmt, uid, numberInputValue } from '../storage.js';

function progressPct(targetAmount, available) {
  const target = Number(targetAmount || 0);
  if (target <= 0) return 0;
  return Math.min(100, (Number(available || 0) / target) * 100);
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
      },
    ]);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Targets</h2>
          <p className="card-note">
            Able to buy uses savings & investments excluding pension ({fmt(availableFunds)})
          </p>
        </div>
        <button className="btn btn-ghost" onClick={addRow}>
          + Add
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
                <th className="center">Able to buy</th>
                <th className="num">Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => {
                const target = Number(t.targetAmount || 0);
                const ableToBuy = target > 0 && availableFunds >= target;
                const pct = progressPct(target, availableFunds);
                const remaining = Math.max(0, target - availableFunds);
                return (
                  <tr key={t.id}>
                    <td>
                      <input
                        className="cell-input name"
                        value={t.name}
                        onChange={(e) => update(t.id, 'name', e.target.value)}
                      />
                    </td>
                    <td className="num">
                      <input
                        className="cell-input num year"
                        type="number"
                        value={t.year}
                        onChange={(e) => update(t.id, 'year', numberInputValue(e.target.value))}
                      />
                    </td>
                    <td className="num">
                      <input
                        className="cell-input num"
                        type="number"
                        value={t.targetAmount}
                        onChange={(e) => update(t.id, 'targetAmount', numberInputValue(e.target.value))}
                      />
                    </td>
                    <td className="center able-cell">
                      {ableToBuy ? (
                        <span className="able-tick" title="Able to buy" aria-label="Able to buy">
                          ✓
                        </span>
                      ) : (
                        <span className="able-empty" aria-label="Not yet">
                          —
                        </span>
                      )}
                    </td>
                    <td className="num progress-cell">
                      <div className="progress-meta">
                        <span className={pct >= 100 ? 'positive' : ''}>{pct.toFixed(0)}%</span>
                        {remaining > 0 && (
                          <span className="progress-remaining">{fmt(remaining)} left</span>
                        )}
                      </div>
                      <div className="progress-track" aria-hidden="true">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="row-actions">
                      <button
                        className="btn-icon"
                        title="Remove"
                        onClick={() => onChange(targets.filter((x) => x.id !== t.id))}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
