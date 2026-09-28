import { Text, View } from 'react-native';
import { money } from '../lib/model.mjs';
import { styles as s } from '../theme';
import { Metric } from './UI';

export default function WealthCard({ assets }) {
  return <View style={{ gap: 8 }}>
    <View style={[s.card, s.hero]}>
      <View style={s.between}>
        <Text style={s.heroLabel}>TOTAL WEALTH</Text>
        <View style={s.badge}><Text style={s.heroLabel}>PKR</Text></View>
      </View>
      <Text style={s.heroValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
        {money(assets.valuation)}
      </Text>
      <View style={s.heroMetrics}>
        <Metric label="Total invested" value={money(assets.invested)} />
        <Metric label="Total return" value={`${assets.profit >= 0 ? '+' : ''}${money(assets.profit)}`} positive={assets.profit >= 0} />
      </View>
    </View>
    <View style={s.row}>
      <View style={s.metricTile}><Metric label="Net worth · PKR" value={money(assets.net)} /></View>
      <View style={s.metricTile}><Metric label="Liabilities · PKR" value={money(assets.liabilities)} /></View>
    </View>
  </View>;
}
