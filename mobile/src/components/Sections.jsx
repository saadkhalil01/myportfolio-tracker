import { Text, View } from 'react-native';
import { money, holdingValues, recordValuation, stockAllocation, wealth } from '../lib/model.mjs';
import { styles as s } from '../theme';
import { Button } from './UI';
import { DonutChart, GrowthChart } from './Charts';
import StockLogo from './StockLogo';

export default function Sections({ tab, data, quotes, store }) {
  return tab === 'Growth' ? <Growth data={data} quotes={quotes} store={store} /> : <Stocks data={data} quotes={quotes} />;
}

function Growth({ data, quotes, store }) {
  const history = data.valuationHistory || [];
  const current = wealth(data, quotes).valuation;
  const first = Number(history[0]?.valuation ?? current);
  const peak = Math.max(1, current, ...history.map((point) => point.valuation));
  return <><GrowthChart points={history} /><View style={s.card}><Text style={s.heading}>Growth</Text><Text style={s.muted}>All investment categories and brokerage holdings; snapshots include cash.</Text>
    <View style={s.row}><View style={s.grow}><Text style={s.muted}>Starting value</Text><Text style={s.number}>PKR {money(first)}</Text></View><View style={s.grow}><Text style={s.muted}>Current value</Text><Text style={s.number}>PKR {money(current)}</Text></View></View>
    <Text style={[s.text, current >= first ? s.positive : s.negative]}>Change PKR {money(current - first)}{first > 0 ? ` (${money((current - first) / first * 100)}%)` : ''}</Text>
    <Button title="Save today's valuation" secondary disabled={store.busy} onPress={() => store.update((value) => recordValuation(value, quotes))} />
    <Text style={s.muted}>One snapshot per day. Missing stock prices use average buy cost.</Text>
    {history.slice(-30).reverse().map((item) => <View key={item.date} style={[s.divider, { gap: 8 }]}>
      <View style={s.between}><Text style={s.text}>{item.date}</Text><Text style={s.number}>PKR {money(item.valuation)}</Text></View>
      <View style={{ height: 5, backgroundColor: '#39dbc1', borderRadius: 3, width: `${Math.max(0, Math.min(100, item.valuation / peak * 100))}%` }} />
    </View>)}
  </View></>;
}

function Stocks({ data, quotes }) {
  const holdings = data.portfolios.flatMap((portfolio) => portfolio.holdings.map((holding) => ({ ...holding, portfolio: portfolio.name, portfolioId: portfolio.id })));
  return <><DonutChart title="Stock allocation" items={stockAllocation(data, quotes)} /><View style={s.card}><Text style={s.heading}>Stocks</Text><Text style={s.muted}>PSX holdings across all portfolios</Text>
    {!holdings.length && <Text style={s.text}>No PSX holdings recorded yet.</Text>}
    {holdings.map((holding) => { const result = holdingValues(holding, quotes); return <View key={`${holding.portfolioId}-${holding.id}`} style={[s.between, s.divider]}>
      <StockLogo name={holding.name} />
      <View style={s.grow}><Text style={s.number}>{holding.name.toUpperCase()}</Text><Text style={s.muted}>{holding.portfolio} · {money(holding.shares)} shares</Text></View>
      <Text style={s.number}>PKR {money(result.value)}</Text>
    </View>; })}
  </View></>;
}
