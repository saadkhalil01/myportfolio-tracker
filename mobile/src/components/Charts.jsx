import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors, styles as s } from '../theme';
import { money } from '../lib/model.mjs';

const palette = ['#69d29a', '#3b8ff5', '#a46ce0', '#f5b84b', '#ef6f6c', '#4cc9c0', '#7793f5'];

export function DonutChart({ title = 'Allocation', items }) {
  const rows = items.filter((item) => Number(item.value) > 0);
  const total = rows.reduce((sum, item) => sum + Number(item.value), 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return <View style={s.chartCard}>
    <Text style={s.heading}>{title}</Text>
    {!total ? <Text style={s.muted}>Add values to see this chart.</Text> : <>
      <View style={s.chartCenter}>
        <Svg width={170} height={170} viewBox="0 0 170 170">
          <Circle cx="85" cy="85" r={radius} stroke={colors.border} strokeWidth="25" fill="none" />
          {rows.map((item, index) => {
            const length = Number(item.value) / total * circumference;
            const segment = <Circle key={item.key || item.name} cx="85" cy="85" r={radius} fill="none"
              stroke={palette[index % palette.length]} strokeWidth="25" strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset} rotation="-90" origin="85, 85" />;
            offset += length;
            return segment;
          })}
        </Svg>
        <View pointerEvents="none" style={s.donutLabel}><Text style={s.muted}>TOTAL</Text><Text style={s.number}>{money(total)}</Text></View>
      </View>
      <View style={s.legend}>{rows.map((item, index) => <View key={item.key || item.name} style={s.legendItem}>
        <View style={[s.legendDot, { backgroundColor: palette[index % palette.length] }]} />
        <Text style={s.muted}>{item.name} · {money(item.value / total * 100)}%</Text>
      </View>)}</View>
    </>}
  </View>;
}

export function GrowthChart({ points }) {
  const rows = points.length === 1
    ? [{ date: 'Start', valuation: points[0].invested, invested: points[0].invested }, ...points]
    : points;
  const values = rows.flatMap((point) => [Number(point.valuation), Number(point.invested)]);
  const low = Math.min(...values, 0);
  const high = Math.max(...values, 1);
  const x = (index) => 12 + index * 296 / Math.max(1, rows.length - 1);
  const y = (value) => 142 - (Number(value) - low) / Math.max(1, high - low) * 122;
  const path = (key) => rows.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point[key])}`).join(' ');
  return <View style={s.chartCard}>
    <View style={s.between}><Text style={s.heading}>Valuation history</Text><Text style={s.muted}>Value / Invested</Text></View>
    <Svg width="100%" height={160} viewBox="0 0 320 160">
      {[20, 60, 100, 140].map((line) => <Line key={line} x1="10" y1={line} x2="310" y2={line} stroke={colors.border} strokeWidth="1" />)}
      <Path d={path('invested')} fill="none" stroke="#6f8790" strokeWidth="3" strokeDasharray="5 5" />
      <Path d={path('valuation')} fill="none" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {rows.map((point, index) => <Circle key={`${point.date}-${index}`} cx={x(index)} cy={y(point.valuation)} r="4" fill={colors.accent} />)}
    </Svg>
    <View style={s.between}><Text style={s.muted}>{rows[0]?.date || 'Start'}</Text><Text style={s.muted}>{rows.at(-1)?.date || 'Today'}</Text></View>
  </View>;
}
