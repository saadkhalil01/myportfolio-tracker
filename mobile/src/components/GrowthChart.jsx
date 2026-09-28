import { useId } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg';
import { colors, styles as s } from '../theme';
import { money } from '../lib/model.mjs';
import EmptyState from './EmptyState';

const compact = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function GrowthChart({ points }) {
  const gradient = `growth${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const rows = points.filter((point) => Number.isFinite(Number(point.valuation)) && Number.isFinite(Number(point.invested)));
  if (!rows.length) return <View style={s.chartCard}>
    <Text style={s.heading}>Valuation history</Text>
    <EmptyState icon="growth" title="Watch your wealth grow" description="Save your first valuation below. Each daily snapshot adds to your history." />
  </View>;
  const values = rows.flatMap((point) => [Number(point.valuation), Number(point.invested)]);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = Math.max((maximum - minimum) * 0.15, Math.abs(maximum) * 0.02, 1);
  const low = minimum - padding;
  const high = maximum + padding;
  const x = (index) => rows.length === 1 ? 180 : 52 + index * 256 / (rows.length - 1);
  const y = (value) => 148 - (Number(value) - low) / (high - low) * 128;
  const path = (key) => rows.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point[key])}`).join(' ');
  const area = `${path('valuation')} L ${x(rows.length - 1)} 148 L ${x(0)} 148 Z`;
  return <View style={s.chartCard}>
    <Text style={s.heading}>Valuation history</Text>
    <View style={s.field}>
      <Text style={s.label}>LATEST VALUE · PKR</Text>
      <Text style={s.total} numberOfLines={1} adjustsFontSizeToFit>{money(rows.at(-1).valuation)}</Text>
    </View>
    <View style={s.legend}>
      <Legend label="Valuation" color={colors.accent} />
      <Legend label="Invested (dashed)" color="#91a4b6" />
    </View>
    <Svg width="100%" height={190} viewBox="0 0 320 170" accessible
      accessibilityLabel={`Valuation history: ${rows.length} snapshots. Latest value PKR ${money(rows.at(-1).valuation)}.`}>
      <Defs><LinearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={colors.accent} stopOpacity="0.22" />
        <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
      </LinearGradient></Defs>
      {[20, 84, 148].map((line) => <ChartGrid key={line} line={line} value={high - (line - 20) / 128 * (high - low)} />)}
      {rows.length > 1 && <Path d={area} fill={`url(#${gradient})`} />}
      <Path d={path('invested')} fill="none" stroke="#91a4b6" strokeWidth="2" strokeDasharray="5 5" />
      <Path d={path('valuation')} fill="none" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {rows.length === 1 && <Circle cx={x(0)} cy={y(rows[0].invested)} r="4" fill="#91a4b6" />}
      {rows.map((point, index) => <Circle key={`${point.date}-${index}`} cx={x(index)} cy={y(point.valuation)}
        r={index === rows.length - 1 ? 5 : 3} fill={colors.accent} stroke={colors.card} strokeWidth="2" />)}
    </Svg>
    <View style={s.between}><Text style={s.muted}>{rows[0].date}</Text>
      <Text style={s.muted}>{rows.length === 1 ? 'First snapshot' : rows.at(-1).date}</Text></View>
  </View>;
}

function Legend({ label, color }) {
  return <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: color }]} /><Text style={s.muted}>{label}</Text></View>;
}

function ChartGrid({ line, value }) {
  return <>
    <Line x1="52" y1={line} x2="310" y2={line} stroke={colors.border} strokeWidth="1" strokeDasharray="3 5" />
    <SvgText x="44" y={line + 4} textAnchor="end" fill={colors.muted} fontSize="10">{compact(value)}</SvgText>
  </>;
}
