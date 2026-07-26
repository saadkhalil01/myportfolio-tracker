import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { fmt, fmtPct, uid } from '../storage.js';

const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #d8dee8',
  borderRadius: 6,
  color: '#1a2332',
  boxShadow: '0 4px 12px rgba(26, 35, 50, 0.08)',
  fontFamily: "'Google Sans', system-ui, sans-serif",
  padding: '8px 12px',
  fontSize: 12,
};

function formatAxisDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

function GrowthTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <div style={{ color: '#6b778c', marginBottom: 4 }}>{formatAxisDate(point.date)}</div>
      <div>
        <span style={{ color: '#6b778c' }}>Valuation</span>
        <span style={{ marginLeft: 8, fontWeight: 600 }}>{fmt(point.valuation)}</span>
      </div>
      <div>
        <span style={{ color: '#6b778c' }}>Invested</span>
        <span style={{ marginLeft: 8, fontWeight: 600 }}>{fmt(point.invested)}</span>
      </div>
    </div>
  );
}

export default function GrowthChart({ history, startDate, onChange }) {
  const [draft, setDraft] = useState({ date: '', valuation: '', invested: '' });

  const series = useMemo(
    () => [...(history || [])].sort((a, b) => a.date.localeCompare(b.date)),
    [history]
  );

  const stats = useMemo(() => {
    if (!series.length) {
      return { start: 0, end: 0, change: 0, changePct: 0, high: 0, low: 0, up: true };
    }
    const start = series[0].valuation;
    const end = series[series.length - 1].valuation;
    const change = end - start;
    const changePct = start > 0 ? (change / start) * 100 : 0;
    const vals = series.map((p) => p.valuation);
    return {
      start,
      end,
      change,
      changePct,
      high: Math.max(...vals),
      low: Math.min(...vals),
      up: change >= 0,
    };
  }, [series]);

  const stroke = stats.up ? '#0d7a4f' : '#b42318';
  const fillId = 'growthFill';

  const addPoint = () => {
    if (!draft.date || draft.valuation === '') return;
    const next = [
      ...series.filter((p) => p.date !== draft.date),
      {
        id: uid(),
        date: draft.date,
        valuation: Number(draft.valuation),
        invested: Number(draft.invested || 0),
      },
    ].sort((a, b) => a.date.localeCompare(b.date));
    onChange(next);
    setDraft({ date: '', valuation: '', invested: '' });
  };

  const removePoint = (date) => {
    onChange(series.filter((p) => p.date !== date));
  };

  const axisTick = {
    fill: '#6b778c',
    fontSize: 11,
    fontFamily: 'Google Sans, system-ui, sans-serif',
  };

  return (
    <section className="card growth-card">
      <div className="card-header">
        <div>
          <h2>Portfolio growth</h2>
          <p className="card-note">
            From {formatAxisDate(startDate || series[0]?.date || '')} to today — valuation over
            time. Today updates automatically when you change numbers.
          </p>
        </div>
      </div>

      <div className="insight-stats growth-stats">
        <div className="insight-stat">
          <span className="stat-label">Starting value</span>
          <span className="stat-value">{fmt(stats.start)}</span>
        </div>
        <div className="insight-stat">
          <span className="stat-label">Current value</span>
          <span className="stat-value">{fmt(stats.end)}</span>
        </div>
        <div className="insight-stat">
          <span className="stat-label">Change</span>
          <span className={`stat-value ${stats.up ? 'positive' : 'negative'}`}>
            {stats.change >= 0 ? '+' : ''}
            {fmt(stats.change)}
          </span>
          <span className={`stat-sub ${stats.up ? 'positive' : 'negative'}`}>
            {fmtPct(stats.changePct)}
          </span>
        </div>
        <div className="insight-stat">
          <span className="stat-label">Range</span>
          <span className="stat-value range-value">
            {fmt(stats.low)} – {fmt(stats.high)}
          </span>
        </div>
      </div>

      {series.length < 2 ? (
        <p className="empty-note">
          Need at least two history points to draw the chart. Add a past valuation below.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={series} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eef1f5" vertical={false} />
            <XAxis
              dataKey="date"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAxisDate}
              minTickGap={28}
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={72}
              tickFormatter={fmt}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<GrowthTooltip />} />
            <ReferenceLine
              y={stats.start}
              stroke="#c5cdd9"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
            <Area
              type="monotone"
              dataKey="valuation"
              stroke={stroke}
              strokeWidth={2.5}
              fill={`url(#${fillId})`}
              name="Valuation"
              dot={{ r: 3, fill: stroke, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div className="history-editor">
        <h3 className="subheading">Log a past valuation</h3>
        <div className="history-form">
          <input
            className="cell-input"
            type="date"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
          <input
            className="cell-input num"
            type="number"
            placeholder="Valuation"
            value={draft.valuation}
            onChange={(e) => setDraft({ ...draft, valuation: e.target.value })}
          />
          <input
            className="cell-input num"
            type="number"
            placeholder="Invested (optional)"
            value={draft.invested}
            onChange={(e) => setDraft({ ...draft, invested: e.target.value })}
          />
          <button className="btn" onClick={addPoint} disabled={!draft.date || draft.valuation === ''}>
            Add point
          </button>
        </div>

        {series.length > 0 && (
          <div className="table-scroll">
            <table className="data-table history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Valuation</th>
                  <th className="num">Invested</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...series].reverse().map((p) => (
                  <tr key={p.date}>
                    <td>{formatAxisDate(p.date)}</td>
                    <td className="num">{fmt(p.valuation)}</td>
                    <td className="num">{fmt(p.invested)}</td>
                    <td className="row-actions">
                      <button
                        className="btn-icon"
                        title="Remove point"
                        onClick={() => removePoint(p.date)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
