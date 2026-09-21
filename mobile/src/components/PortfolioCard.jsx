import { Text, View } from 'react-native';
import { money, totals } from '../lib/model.mjs';
import { styles as s } from '../theme';
import { Button } from './UI';
import HoldingRow from './HoldingRow';

export default function PortfolioCard({ portfolio, quotes, edit, disabled }) {
  const result = totals([portfolio], quotes);
  return <View style={s.card}>
    <View style={s.between}>
      <View style={s.grow}>
        <Text style={s.label}>{portfolio.broker || 'INVESTMENT PORTFOLIO'}</Text>
        <Text style={s.heading}>{portfolio.name}</Text>
      </View>
      <Button title="Edit" secondary disabled={disabled} onPress={() => edit({ kind: 'portfolio', portfolio })} />
    </View>
    <Text style={s.text}>PKR {money(result.value)} <Text style={s.muted}>· cash {money(result.cash)}</Text></Text>
    {portfolio.goal ? <Text style={s.muted}>{portfolio.goal}</Text> : null}
    {portfolio.holdings.map((holding) => <HoldingRow key={holding.id} holding={holding} quotes={quotes}
      disabled={disabled} onPress={() => edit({ kind: 'holding', portfolio, holding })} />)}
    {!portfolio.holdings.length && <Text style={s.muted}>Add your first stock to track prices and returns.</Text>}
    <Button title="+ Add stock" secondary disabled={disabled} onPress={() => edit({ kind: 'holding', portfolio })} />
  </View>;
}
