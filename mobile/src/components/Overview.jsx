import { Text, View } from 'react-native';
import { colors, styles as s } from '../theme';
import { assetAllocation, money, totals, wealth } from '../lib/model.mjs';
import Summary from './Summary';
import { Metric } from './UI';
import { DonutChart } from './Charts';

export default function Overview({ data, portfolios, quotes }) {
  const assets = wealth(data, quotes);
  const total = totals(portfolios, quotes).value;
  const count = portfolios.reduce((sum, p) => sum + p.holdings.length, 0);
  return <>
    <View style={s.card}>
      <Text style={s.label}>TOTAL WEALTH · PKR</Text><Text style={s.total}>{money(assets.valuation)}</Text>
      <View style={s.row}><Metric label="Invested" value={money(assets.invested)} /><Metric label="Return" value={money(assets.profit)} positive={assets.profit >= 0} /></View>
      <View style={s.row}><Metric label="Liabilities" value={money(assets.liabilities)} /><Metric label="Net worth" value={money(assets.net)} /></View>
    </View>
    <DonutChart items={assetAllocation(data, quotes)} />
    <Summary portfolios={portfolios} quotes={quotes} />
    <View style={s.card}>
      <Text style={s.heading}>Your portfolios</Text>
      <Text style={s.muted}>{portfolios.length} portfolios · {count} holdings</Text>
      {portfolios.map((p) => <Allocation key={p.id} portfolio={p} total={total} quotes={quotes} />)}
      {!count && <Text style={s.text}>Open Holdings to add your portfolios and PSX stocks.</Text>}
    </View>
    <Text style={s.muted}>Values include brokerage cash. Stocks without a price are valued at average buy cost. These totals cover stocks only.</Text>
  </>;
}

function Allocation({ portfolio, quotes, total }) {
  const value = totals([portfolio], quotes).value;
  const percent = total > 0 ? Math.max(0, Math.min(100, value / total * 100)) : 0;
  return <View style={{ gap: 8 }}>
    <View style={s.between}>
      <Text style={[s.text, s.grow]}>{portfolio.name}</Text>
      <Text style={s.number}>{money(value)}</Text>
    </View>
    <View accessibilityLabel={`${portfolio.name}: ${Math.round(percent)} percent`} style={{ height: 6, borderRadius: 3, backgroundColor: colors.border }}>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.accent, width: `${percent}%` }} />
    </View>
  </View>;
}
