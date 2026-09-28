import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, styles as s } from '../theme';
import { money } from '../lib/model.mjs';
import EmptyState from './EmptyState';

const palette = ['#39dbc1', '#75a7ff', '#b59afa', '#f5c777', '#ff808a', '#72d3ea', '#a6b9d5'];

export function DonutChart({ title = 'Allocation', items }) {
  const rows = items.filter((item) => Number(item.value) > 0);
  const total = rows.reduce((sum, item) => sum + Number(item.value), 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return <View style={s.chartCard}>
    <Text style={s.heading}>{title}</Text>
    {!total ? <EmptyState icon="overview" title="See the bigger picture" description="Add records with a value to see this breakdown." /> : <>
      <View style={s.chartCenter}>
        <Svg width={170} height={170} viewBox="0 0 170 170">
          <Circle cx="85" cy="85" r={radius} stroke={colors.border} strokeWidth="18" fill="none" />
          {rows.map((item, index) => {
            const length = Number(item.value) / total * circumference;
            const segment = <Circle key={item.key || item.name} cx="85" cy="85" r={radius} fill="none"
              stroke={palette[index % palette.length]} strokeWidth="18" strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset} rotation="-90" origin="85, 85" />;
            offset += length;
            return segment;
          })}
        </Svg>
        <View pointerEvents="none" style={s.donutLabel}><Text style={s.muted}>TOTAL</Text><Text style={[s.number, { maxWidth: 116 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{money(total)}</Text></View>
      </View>
      <View style={s.allocationLegend}>{rows.map((item, index) => <View key={item.key || item.name} style={s.allocationLegendRow}>
        <View style={[s.legendDot, { backgroundColor: palette[index % palette.length] }]} />
        <View style={s.grow}>
          <Text style={s.text}>{item.name}</Text>
          <Text style={s.muted}>PKR {money(item.value)}</Text>
        </View>
        <Text style={s.number}>{money(item.value / total * 100)}%</Text>
      </View>)}</View>
    </>}
  </View>;
}

export { default as GrowthChart } from './GrowthChart';
