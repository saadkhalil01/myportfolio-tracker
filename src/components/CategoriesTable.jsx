import { fmt, fmtPct, uid } from '../storage.js';

export default function CategoriesTable({ categories, onChange }) {
  const update = (id, field, value) => {
    onChange(categories.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const addRow = () => {
    onChange([...categories, { id: uid(), name: 'New Category', invested: 0, currentValue: 0 }]);
  };

  const removeRow = (id) => {
    onChange(categories.filter((c) => c.id !== id));
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Investments</h2>
        <button className="btn btn-ghost" onClick={addRow}>
          + Add category
        </button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Category</th>
            <th className="num">Invested</th>
            <th className="num">Current Value</th>
            <th className="num">Gain</th>
            <th className="num">Change %</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => {
            const gain = c.currentValue - c.invested;
            const pct = c.invested > 0 ? (gain / c.invested) * 100 : 0;
            const gainClass = gain > 0 ? 'positive' : gain < 0 ? 'negative' : '';
            return (
              <tr key={c.id}>
                <td>
                  <input
                    className="cell-input name"
                    value={c.name}
                    onChange={(e) => update(c.id, 'name', e.target.value)}
                  />
                </td>
                <td className="num">
                  <input
                    className="cell-input num"
                    type="number"
                    value={c.invested}
                    onChange={(e) => update(c.id, 'invested', Number(e.target.value))}
                  />
                </td>
                <td className="num">
                  <input
                    className="cell-input num"
                    type="number"
                    value={c.currentValue}
                    onChange={(e) => update(c.id, 'currentValue', Number(e.target.value))}
                  />
                </td>
                <td className={`num ${gainClass}`}>
                  {gain >= 0 ? '+' : ''}
                  {fmt(gain)}
                </td>
                <td className={`num ${gainClass}`}>{fmtPct(pct)}</td>
                <td className="row-actions">
                  <button className="btn-icon" title="Remove" onClick={() => removeRow(c.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
