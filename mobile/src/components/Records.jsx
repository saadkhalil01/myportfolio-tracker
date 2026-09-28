import { Text, View } from 'react-native';
import { assetAllocation, money, targetFunds, wealth } from '../lib/model.mjs';
import { isStocksCategory } from '../../../src/storage.js';
import { styles as s } from '../theme';
import { Button } from './UI';
import { DonutChart } from './Charts';

const kinds = { Investments: 'categories', Liabilities: 'liabilities', Targets: 'targets' };
export default function Records({ tab, data, quotes, edit, disabled }) {
  const kind = kinds[tab];
  const total = wealth(data, quotes);
  const available = targetFunds(data, quotes);
  const chart = kind === 'categories' ? assetAllocation(data, quotes)
    : kind === 'liabilities' ? data.liabilities.map((item) => ({ key: item.id, name: item.name, value: item.amount }))
    : data.targets.map((item) => ({ key: item.id, name: item.name, value: item.targetAmount * item.buyMultiplier }));
  return <><DonutChart title={`${tab} breakdown`} items={chart} /><View style={s.card}>
    <Text style={s.heading}>{tab}</Text>
    <Text style={s.number}>PKR {money(kind === 'categories' ? total.valuation : kind === 'liabilities' ? total.liabilities : available)}</Text>
    <Text style={s.muted}>{kind === 'targets' ? 'Funds excluding pension; each target is assessed independently.' : kind === 'categories' ? 'All investments, with brokerage holdings counted once.' : 'Total outstanding liabilities'}</Text>
    <Button title={`+ Add ${kind === 'categories' ? 'investment' : kind === 'targets' ? 'target' : 'liability'}`} disabled={disabled} onPress={() => edit({ kind })} />
    {!data[kind].length && <Text style={s.muted}>No records yet. Add your first one above.</Text>}
    {data[kind].map((item) => <View key={item.id} style={[s.divider, { gap: 8 }]}>
      <View style={s.between}><Text style={[s.number, s.grow]}>{item.name}</Text><Button title="Edit" secondary disabled={disabled} onPress={() => edit({ kind, item })} /></View>
      {kind === 'categories' && <Text style={s.text}>Invested {money(item.invested)} · Value {money(isStocksCategory(item) && total.stocksFromInsights ? total.stocksValue : item.currentValue)}</Text>}
      {kind === 'liabilities' && <Text style={s.text}>PKR {money(item.amount)}</Text>}
      {kind === 'targets' && <TargetProgress item={item} available={available} />}
    </View>)}
    {kind === 'categories' && <Text style={s.muted}>Manage stock positions and brokerage cash in Holdings. Stock category valuation follows those positions when present.</Text>}
  </View></>;
}

function TargetProgress({ item, available }) {
  const required = item.targetAmount * item.buyMultiplier;
  const percent = required > 0 ? Math.max(0, Math.min(100, available / required * 100)) : 0;
  return <View style={{ gap: 6 }}>
    <Text style={s.text}>{item.year} · PKR {money(required)} needed ({item.buyMultiplier}×)</Text>
    <View style={s.progressTrack} accessibilityRole="progressbar" accessibilityLabel={`${item.name} funding progress`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}>
      <View style={[s.progressFill, { width: `${percent}%` }]} />
    </View>
    <Text style={[s.muted, required > 0 && available >= required && s.positive]}>{Math.round(percent)}% · {money(Math.max(0, required - available))} remaining</Text>
  </View>;
}
