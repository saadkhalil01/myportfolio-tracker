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
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { fmt } from '../storage.js';

const CHART_STYLES = [
  { id: 'donut', label: 'Donut' },
  { id: 'pie', label: 'Pie' },
  { id: 'bar', label: 'Bar' },
  { id: 'hbar', label: 'Horizontal bar' },
  { id: 'line', label: 'Line' },
  { id: 'area', label: 'Area' },
];

const PALETTE = [
  '#1a56db',
  '#0d7a4f',
  '#7c3aed',
  '#b45309',
  '#be185d',
  '#0e7490',
  '#c2410c',
  '#64748b',
];

const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #d8dee8',
  borderRadius: 6,
  color: '#1a2332',
  boxShadow: '0 4px 12px rgba(26, 35, 50, 0.08)',
  fontFamily: "'Google Sans', system-ui, sans-serif",
};

const axisTick = {
  fill: '#6b778c',
  fontSize: 11,
  fontFamily: 'Google Sans, system-ui, sans-serif',
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...tooltipStyle, padding: '8px 12px', fontSize: 12 }}>
      {payload.map((p) => (
        <div key={p.name || p.dataKey}>
          <span style={{ color: '#6b778c' }}>{p.name || p.payload?.name}</span>
          <span style={{ marginLeft: 8, fontWeight: 600 }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function withColors(data) {
  return data.map((d, i) => ({
    ...d,
    color: d.color || PALETTE[i % PALETTE.length],
  }));
}

function FlexibleChart({ data, style, chartId }) {
  const colored = withColors(data);
  const empty = colored.length === 0 || colored.every((d) => !d.value);
  const gradientId = `areaFill-${chartId}`;

  if (empty) {
    return <p className="empty-note">No data to chart.</p>;
  }

  if (style === 'donut' || style === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={colored}
            dataKey="value"
            nameKey="name"
            innerRadius={style === 'donut' ? 58 : 0}
            outerRadius={88}
            paddingAngle={style === 'donut' ? 1.5 : 1}
            stroke="#fff"
            strokeWidth={2}
          >
            {colored.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (style === 'hbar') {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={colored}
          layout="vertical"
          margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
        >
          <CartesianGrid stroke="#eef1f5" horizontal={false} />
          <XAxis
            type="number"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmt}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={88}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(26, 35, 50, 0.04)' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} name="Value">
            {colored.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (style === 'line') {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={colored} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="#eef1f5" vertical={false} />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={64} tickFormatter={fmt} />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1a56db"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#1a56db', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            name="Value"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (style === 'area') {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={colored} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a56db" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#1a56db" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#eef1f5" vertical={false} />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={64} tickFormatter={fmt} />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#1a56db"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            name="Value"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // default: bar
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={colored} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid stroke="#eef1f5" vertical={false} />
        <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={64} tickFormatter={fmt} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(26, 35, 50, 0.04)' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48} name="Value">
          {colored.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartCard({ title, chartId, data, style, onStyleChange }) {
  return (
    <div className="card chart-card">
      <div className="card-header chart-header">
        <h2>{title}</h2>
        <label className="chart-style">
          <span className="sr-only">Chart style</span>
          <select
            value={style}
            onChange={(e) => onStyleChange(e.target.value)}
            aria-label={`${title} chart style`}
          >
            {CHART_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <FlexibleChart data={data} style={style} chartId={chartId} />
    </div>
  );
}

export const DEFAULT_CHART_STYLES = {
  allocation: 'donut',
  net: 'donut',
  comparison: 'bar',
};

export default function ChartsPanel({ categories, totals, liabilitiesTotal, chartStyles, onChangeStyles }) {
  const styles = { ...DEFAULT_CHART_STYLES, ...chartStyles };

  const allocation = categories
    .filter((c) => c.currentValue > 0)
    .map((c) => ({ name: c.name, value: c.currentValue }));

  const netData = [
    { name: 'Investments', value: totals.currentValue, color: '#0d7a4f' },
    { name: 'Liabilities', value: liabilitiesTotal, color: '#b42318' },
  ];

  const comparison = [
    { name: 'Invested', value: totals.invested, color: '#64748b' },
    { name: 'Current value', value: totals.currentValue, color: '#1a56db' },
  ];

  const setStyle = (key, value) => {
    onChangeStyles({ ...styles, [key]: value });
  };

  return (
    <section className="charts-grid">
      <ChartCard
        title="Allocation"
        chartId="allocation"
        data={allocation}
        style={styles.allocation}
        onStyleChange={(v) => setStyle('allocation', v)}
      />
      <ChartCard
        title="Investments vs liabilities"
        chartId="net"
        data={netData}
        style={styles.net}
        onStyleChange={(v) => setStyle('net', v)}
      />
      <ChartCard
        title="Invested vs valuation"
        chartId="comparison"
        data={comparison}
        style={styles.comparison}
        onStyleChange={(v) => setStyle('comparison', v)}
      />
    </section>
  );
}
