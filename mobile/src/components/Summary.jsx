import { Text, View } from 'react-native';
import { money, totals } from '../lib/model.mjs';
import { styles as s } from '../theme';
import { Metric } from './UI';

export default function Summary({ portfolios, quotes }) {
  const result = totals(portfolios, quotes);
  return <View style={s.card}>
    <Text style={s.label}>STOCK PORTFOLIO · PKR</Text>
    <Text style={s.total}>{money(result.value)}</Text>
    <Text style={[s.text, result.profit >= 0 ? s.positive : s.negative]}>
      {result.profit >= 0 ? '+' : ''}{money(result.profit)} unrealized return
    </Text>
    <View style={[s.row, s.divider]}>
      <Metric label="Cost + cash" value={money(result.invested)} />
      <Metric label="Available cash" value={money(result.cash)} />
    </View>
  </View>;
}
