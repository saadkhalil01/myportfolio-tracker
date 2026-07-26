import { uid } from '../storage.js';

export default function Targets({ targets, goals, onChangeTargets, onChangeGoals }) {
  const updateTarget = (id, field, value) => {
    onChangeTargets(targets.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const updateGoal = (id, field, value) => {
    onChangeGoals(goals.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Targets & Goals</h2>
        <button
          className="btn btn-ghost"
          onClick={() =>
            onChangeTargets([
              ...targets,
              { id: uid(), name: 'New target', year: new Date().getFullYear() + 1 },
            ])
          }
        >
          + Add
        </button>
      </div>
      <ul className="item-list">
        {targets.map((t) => (
          <li key={t.id}>
            <input
              className="cell-input name"
              value={t.name}
              onChange={(e) => updateTarget(t.id, 'name', e.target.value)}
            />
            <input
              className="cell-input num year"
              type="number"
              value={t.year}
              onChange={(e) => updateTarget(t.id, 'year', Number(e.target.value))}
            />
            <button
              className="btn-icon"
              title="Remove"
              onClick={() => onChangeTargets(targets.filter((x) => x.id !== t.id))}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <h3 className="subheading">Savings goals</h3>
      <ul className="item-list">
        {goals.map((g) => (
          <li key={g.id}>
            <input
              className="cell-input name"
              value={g.name}
              onChange={(e) => updateGoal(g.id, 'name', e.target.value)}
            />
            <input
              className="cell-input num"
              type="number"
              value={g.amount}
              onChange={(e) => updateGoal(g.id, 'amount', Number(e.target.value))}
            />
            <button
              className="btn-icon"
              title="Remove"
              onClick={() => onChangeGoals(goals.filter((x) => x.id !== g.id))}
            >
              ✕
            </button>
          </li>
        ))}
        <li>
          <button
            className="btn btn-ghost small"
            onClick={() => onChangeGoals([...goals, { id: uid(), name: 'New goal', amount: 0 }])}
          >
            + Add goal
          </button>
        </li>
      </ul>
    </div>
  );
}
