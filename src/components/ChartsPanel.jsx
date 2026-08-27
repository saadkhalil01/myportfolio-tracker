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
import { categoryChartColor } from '../categoryColors.js';
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
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  boxShadow: '0 4px 12px rgba(26, 35, 50, 0.08)',
  fontFamily: "'Google Sans', system-ui, sans-serif",
};

const axisTick = {
  fill: 'var(--text-muted)',
  fontSize: 11,
  fontFamily: 'Google Sans, system-ui, sans-serif',
};

function fmtPct(n) {
  return `${Number(n || 0).toFixed(1)}%`;
}

function withPercents(data) {
  const hasNeg = data.some((d) => Number(d.value || 0) < 0);
  const total = data.reduce((s, d) => {
    const v = Number(d.value || 0);
    return s + (hasNeg ? Math.abs(v) : v);
  }, 0);
  return data.map((d, i) => ({
    ...d,
    color: d.color || PALETTE[i % PALETTE.length],
    pct: total > 0 ? (Math.abs(Number(d.value || 0)) / total) * 100 : 0,
  }));
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...tooltipStyle, padding: '8px 12px', fontSize: 12 }}>
      {payload.map((p) => {
        const name = p.name || p.payload?.name;
        const pct = p.payload?.pct;
        return (
          <div key={name || p.dataKey}>
            <span style={{ color: 'var(--text-muted)' }}>{name}</span>
            <span style={{ marginLeft: 8, fontWeight: 600 }}>{fmt(p.value)}</span>
            {pct != null && (
              <span style={{ marginLeft: 6, color: 'var(--text-muted)' }}>({fmtPct(pct)})</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function legendFormatter(value, entry) {
  const pct = entry?.payload?.pct;
  return pct != null ? `${value} · ${fmtPct(pct)}` : value;
}

function coverageInfo(assets, liabilities) {
  if (liabilities <= 0) {
    return {
      coverage: assets > 0 ? 2 : 0,
      markerPct: assets > 0 ? 100 : 0,
      status: 'Safe',
      statusClass: 'safe',
      detail: 'No liabilities',
    };
  }
  const coverage = assets / liabilities;
  // Map 0 → 2x coverage onto the strip (2x+ = full safe end)
  const markerPct = Math.min(100, Math.max(0, (coverage / 2) * 100));
  let status = 'Safe';
  let statusClass = 'safe';
  if (coverage < 0.5) {
    status = 'Danger';
    statusClass = 'danger';
  } else if (coverage < 0.85) {
    status = 'Caution';
    statusClass = 'caution';
  } else if (coverage < 1) {
    status = 'Tight';
    statusClass = 'caution';
  }
  return {
    coverage,
    markerPct,
    status,
    statusClass,
    detail: `${(coverage * 100).toFixed(0)}% covered`,
  };
}

function CoverageScale({ assets, liabilities }) {
  const info = coverageInfo(assets, liabilities);
  return (
    <div className="coverage-scale">
      <div className="coverage-track" aria-label={`${info.status} · ${info.detail}`}>
        <div className="coverage-gradient" />
        <div className="coverage-marker" style={{ left: `${info.markerPct}%` }} />
      </div>
    </div>
  );
}

function FlexibleChart({ data, style, chartId, sideLegend = false }) {
  const colored = withPercents(data);
  const empty = colored.length === 0 || colored.every((d) => !d.value);
  const gradientId = `areaFill-${chartId}`;

  if (empty) {
    return <p className="empty-note">No data to chart.</p>;
  }

  if (style === 'donut' || style === 'pie') {
    if (sideLegend) {
      return (
        <div className="chart-side-layout">
          <div className="chart-side-plot">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={colored}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={style === 'donut' ? 58 : 0}
                  outerRadius={88}
                  paddingAngle={style === 'donut' ? 1.5 : 1}
                  stroke="var(--surface-muted)"
                  strokeWidth={2}
                >
                  {colored.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-side-legend" aria-label="Chart legend">
            {colored.map((entry) => (
              <div key={entry.name} className="chart-side-legend-item">
                <span style={{ background: entry.color }} aria-hidden="true" />
                <span>{entry.name} · {fmtPct(entry.pct)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

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
            stroke="var(--surface-muted)"
            strokeWidth={2}
          >
            {colored.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} formatter={legendFormatter} />
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
          <CartesianGrid stroke="var(--border)" horizontal={false} />
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
          <Legend iconType="circle" iconSize={8} formatter={legendFormatter} />
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
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={64} tickFormatter={fmt} />
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} formatter={legendFormatter} />
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
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={64} tickFormatter={fmt} />
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} formatter={legendFormatter} />
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
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={64} tickFormatter={fmt} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(26, 35, 50, 0.04)' }} />
        <Legend iconType="circle" iconSize={8} formatter={legendFormatter} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48} name="Value">
          {colored.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ChartCard({ title, chartId, data, style, onStyleChange, footer, className = '', sideLegend = false }) {
  return (
    <div className={`card chart-card ${className}`.trim()}>
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
      <FlexibleChart data={data} style={style} chartId={chartId} sideLegend={sideLegend} />
      {footer}
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

  const hasStocksCategory = categories.some(
    (c) => c.id === 'stocks' || /^stocks?$/i.test(String(c.name || '').trim())
  );
  const allocation = [
    ...categories
      .filter((c) => Number(c.currentValue || 0) > 0)
      .map((c) => ({
        name: c.name,
        value: Number(c.currentValue || 0),
        color: categoryChartColor(c),
      })),
    ...(!hasStocksCategory && totals.stocksValue > 0
      ? [{ name: 'Stocks', value: totals.stocksValue, color: categoryChartColor({ name: 'Stocks' }) }]
      : []),
  ];

  const netData = [
    { name: 'Assets', value: totals.currentValue, color: '#0d7a4f' },
    { name: 'Liabilities', value: liabilitiesTotal, color: '#b42318' },
  ];

  const comparison = [
    { name: 'Invested', value: totals.invested, color: '#64748b' },
    { name: 'Assets', value: totals.currentValue, color: '#1a56db' },
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
        title="Investments vs Liabilities"
        chartId="net"
        data={netData}
        style={styles.net}
        onStyleChange={(v) => setStyle('net', v)}
        footer={
          <CoverageScale assets={totals.currentValue} liabilities={liabilitiesTotal} />
        }
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
