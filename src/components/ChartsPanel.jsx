import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { fmt } from '../storage.js';

const PALETTE = [
  '#4f8ef7',
  '#34d399',
  '#a78bfa',
  '#fbbf24',
  '#f472b6',
  '#22d3ee',
  '#fb923c',
  '#94a3b8',
];

const tooltipStyle = {
  background: '#141a26',
  border: '1px solid #232c3d',
  borderRadius: 10,
  color: '#e6ebf5',
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...tooltipStyle, padding: '8px 12px', fontSize: 13 }}>
      {payload.map((p) => (
        <div key={p.name}>
          <strong>{p.name}</strong>: {fmt(p.value)}
        </div>
      ))}
    </div>
  );
}

export default function ChartsPanel({ categories, totals, liabilitiesTotal }) {
  const allocation = categories
    .filter((c) => c.currentValue > 0)
    .map((c) => ({ name: c.name, value: c.currentValue }));

  const netData = [
    { name: 'Investments', value: totals.currentValue, color: '#34d399' },
    { name: 'Liabilities', value: liabilitiesTotal, color: '#f87171' },
  ];

  const barData = [
    { name: 'Overall Investment', value: totals.invested, color: '#f87171' },
    { name: 'Current Valuation', value: totals.currentValue, color: '#4f8ef7' },
  ];

  return (
    <section className="charts-grid">
      <div className="card chart-card">
        <h2>Allocation</h2>
        {allocation.length === 0 ? (
          <p className="empty-note">No investments yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={allocation}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                strokeWidth={0}
              >
                {allocation.map((entry, i) => (
                  <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={9} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card chart-card">
        <h2>Investments vs Liabilities</h2>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={netData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
              strokeWidth={0}
            >
              {netData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={9} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h2>Invested vs Valuation</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#8b97ad', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8b97ad', fontSize: 11 }} axisLine={false} tickLine={false} width={70} tickFormatter={fmt} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
              {barData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
