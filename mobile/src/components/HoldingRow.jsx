import { Pressable, Text, View } from 'react-native';
import { holdingValues, money, normalizeSymbol } from '../lib/model.mjs';
import { styles as s } from '../theme';
import StockLogo from './StockLogo';
import { Metric } from './UI';

export default function HoldingRow({ holding, quotes, onPress, disabled }) {
  const result = holdingValues(holding, quotes);
  return <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${holding.name} holding`}
    onPress={onPress} disabled={disabled} style={({ pressed }) => [s.divider, { gap: 12 }, pressed && s.disabled]}>
    <View style={s.row}>
      <StockLogo name={holding.name} />
      <View style={s.grow}>
        <Text style={s.number}>{normalizeSymbol(holding.name)}</Text>
        <Text style={s.muted}>{money(holding.shares)} shares · avg {money(holding.avgBuy)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.number}>{money(result.price)}</Text>
        <Text style={[s.muted, result.changePct >= 0 ? s.positive : s.negative]}>
          {!result.live ? 'At cost' : result.changePct == null ? 'PSX price' : `${result.changePct >= 0 ? '+' : ''}${money(result.changePct)}%`}
        </Text>
      </View>
    </View>
    <View style={s.row}>
      <Metric label="Value · PKR" value={money(result.value)} />
      <Metric label="Unrealized P/L" value={`${result.profit >= 0 ? '+' : ''}${money(result.profit)}`} positive={result.profit >= 0} />
    </View>
  </Pressable>;
}
