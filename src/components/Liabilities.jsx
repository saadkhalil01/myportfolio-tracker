import { useState } from 'react';
import { fmt, uid } from '../storage.js';
import MoneyInput from './MoneyInput.jsx';
import AppIcon from './AppIcon.jsx';
import { ChartCard } from './ChartsPanel.jsx';
import PayoffCalculator from './PayoffCalculator.jsx';

export default function Liabilities({ liabilities, onChange, payoffSettings, onPayoffChange }) {
  const [chartStyle, setChartStyle] = useState('donut');
  const total = liabilities.reduce((s, l) => s + Number(l.amount || 0), 0);
  const sortedLiabilities = [...liabilities].sort(
    (a, b) => Number(b.amount || 0) - Number(a.amount || 0)
  );
  const chartData = sortedLiabilities
    .filter((liability) => Number(liability.amount) > 0)
    .map((liability) => ({ id: liability.id, name: liability.name || 'Unnamed liability', value: Number(liability.amount) }));

  const update = (id, field, value) => {
    onChange(liabilities.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  return (
    <section className="card liabilities-card">
      <div className="card-header">
        <div>
          <h2>Liabilities</h2>
          <p className="card-note">People and loans you owe — amounts in PKR.</p>
        </div>
        <button
          className="btn btn-ghost btn-add"
          onClick={() => onChange([...liabilities, { id: uid(), name: 'New liability', amount: 0 }])}
        >
          <AppIcon name="add" size={18} /> Add
        </button>
      </div>

      <div className="liabilities-layout">
    <ChartCard
      title="Breakdown"
      chartId="liabilities"
      data={chartData}
      style={chartStyle}
      onStyleChange={setChartStyle}
      className="liabilities-chart"
    />
      <div className="liabilities-details">
      {liabilities.length === 0 ? (
        <p className="empty-note">No liabilities yet — use + Add to create one.</p>
      ) : (
        <>
          <ul className="item-list liabilities-list">
            {sortedLiabilities.map((l) => (
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
                  <AppIcon name="remove" size={16} />
                </button>
              </li>
            ))}
          </ul>

          <div className="list-total liabilities-total">
            <span className="list-total-label">Total liabilities</span>
            <span className="list-total-value negative">{fmt(total)}</span>
          </div>
        </>
      )}
    </div>
    </div>
    <PayoffCalculator total={total} settings={payoffSettings} onSettingsChange={onPayoffChange} />
    </section>
  );
}
