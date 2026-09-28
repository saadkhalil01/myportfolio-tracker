import { Text, View } from 'react-native';
import { styles as s } from '../theme';
import { assetAllocation, money, totals, wealth } from '../lib/model.mjs';
import Summary from './Summary';
import WealthCard from './WealthCard';
import QuickActions from './QuickActions';
import { DonutChart } from './Charts';

export default function Overview({ data, portfolios, quotes, onNavigate }) {
  const assets = wealth(data, quotes);
  const total = totals(portfolios, quotes).value;
  const count = portfolios.reduce((sum, p) => sum + p.holdings.length, 0);
  return <>
    <WealthCard assets={assets} />
    <QuickActions onNavigate={onNavigate} />
    <Text style={s.sectionTitle}>Portfolio insights</Text>
    <DonutChart items={assetAllocation(data, quotes)} />
    <Summary portfolios={portfolios} quotes={quotes} />
    <View style={s.card}>
      <Text style={s.heading}>Your portfolios</Text>
      <Text style={s.muted}>{portfolios.length} portfolios · {count} holdings</Text>
      {portfolios.map((p) => <Allocation key={p.id} portfolio={p} total={total} quotes={quotes} />)}
      {!count && <Text style={s.text}>Open Holdings to add your portfolios and PSX stocks.</Text>}
    </View>
    <Text style={s.muted}>Stock portfolio values include brokerage cash. Stocks without a price use average buy cost.</Text>
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
    <View accessibilityLabel={`${portfolio.name}: ${Math.round(percent)} percent`} style={s.allocationTrack}>
      <View style={[s.allocationFill, { width: `${percent}%` }]} />
    </View>
  </View>;
}
