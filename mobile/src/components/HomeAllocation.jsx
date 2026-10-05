import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { assetAllocation } from '../lib/model.mjs';
import { styles as s } from '../theme';
import EmptyState from './EmptyState';

const colorFor = (item, index) => /stock/i.test(item.name) ? '#69cc91' : /pension/i.test(item.name) ? '#aa72df'
  : /emergency/i.test(item.name) ? '#3389fa' : ['#69cc91', '#aa72df', '#3389fa', '#e5b866', '#ef7f91'][index % 5];

export default function HomeAllocation({ data, quotes }) {
  const [donut, setDonut] = useState(false);
  const rows = assetAllocation(data, quotes).filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  const total = rows.reduce((sum, item) => sum + item.value, 0);
  let angle = 0;
  return <View style={s.homeAllocation}>
    <View style={s.between}><Text style={s.heading}>Allocation</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Chart type: ${donut ? 'Donut' : 'Pie'}. Switch chart type`}
        onPress={() => setDonut(!donut)} style={({ pressed }) => [s.homeChartSelector, pressed && s.pressed]}>
        <Text style={s.text}>{donut ? 'Donut' : 'Pie'}</Text><Text style={s.muted}>▾</Text>
      </Pressable></View>
    {!total ? <EmptyState icon="overview" title="Your allocation starts here" description="Add investments to see how your portfolio is distributed." /> : <>
      <View style={s.homeChart} accessibilityRole="image" accessibilityLabel="Investment allocation; percentages listed below">
        <Svg width="100%" height={220} viewBox="0 0 240 240">
          {rows.map((item, index) => {
            const start = angle;
            angle += item.value / total * Math.PI * 2;
            const x1 = 120 + 108 * Math.cos(start), y1 = 120 + 108 * Math.sin(start);
            const x2 = 120 + 108 * Math.cos(angle), y2 = 120 + 108 * Math.sin(angle);
            return rows.length === 1 ? <Circle key={item.key} cx={120} cy={120} r={108} fill={colorFor(item, index)} />
              : <Path key={item.key} d={`M120 120 L${x1} ${y1} A108 108 0 ${angle - start > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`}
                fill={colorFor(item, index)} stroke="#0b171d" strokeWidth={3} />;
          })}
          {donut && <Circle cx={120} cy={120} r={65} fill="#0b171d" />}
        </Svg>
      </View>
      <View style={s.homeLegend}>{rows.map((item, index) => <View key={item.key} style={s.legendItem}>
        <View style={[s.legendDot, { backgroundColor: colorFor(item, index) }]} />
        <Text style={s.muted}>{item.name} · {(item.value / total * 100).toFixed(1)}%</Text>
      </View>)}</View>
    </>}
  </View>;
}
