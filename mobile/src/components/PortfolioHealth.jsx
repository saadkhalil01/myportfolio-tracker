import { useState } from 'react';
import { Text, View } from 'react-native';
import { portfolioHealth } from '../lib/health.mjs';
import { money } from '../lib/model.mjs';
import { styles as s } from '../theme';
import { Button } from './UI';

export default function PortfolioHealth({ data, quotes, onNavigate }) {
  const [expanded, setExpanded] = useState(false);
  const health = portfolioHealth(data, quotes);
  return <View style={s.card}>
    <Text style={s.heading}>Portfolio health</Text>
    <View style={s.between}>
      <Text style={s.total}>{health.score} / 100</Text>
      <Text style={health.score >= 65 ? s.positive : s.muted}>{health.label}</Text>
    </View>
    {expanded && health.factors.map((factor) => <View key={factor.name} style={{ gap: 6 }}>
      <View style={s.between}><Text style={s.text}>{factor.name}</Text><Text style={s.number}>{Math.round(factor.score)}/100</Text></View>
      <View style={s.progressTrack} accessibilityRole="progressbar" accessibilityLabel={factor.name}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(factor.score) }}>
        <View style={[s.progressFill, { width: `${factor.score}%` }]} />
      </View>
      <Text style={s.muted}>{factor.weight}% weight · {factor.detail}</Text>
    </View>)}
    <Button title={expanded ? 'Hide score details' : 'View score & next steps'} secondary expanded={expanded} onPress={() => setExpanded(!expanded)} />
    {expanded && <>
      <Text style={s.text}>Full points require assets worth 3× liabilities, savings covering liabilities (or 20% of assets with no debt), positive returns, and four funded categories.</Text>
      <Text style={s.muted}>{health.savingsGap > 0 ? `Savings buffer gap: PKR ${money(health.savingsGap)}.` : 'Your recorded savings meet the buffer target.'} Mark accessible funds as savings in Investments.</Text>
      <Button title="Review investments" secondary onPress={() => onNavigate('Investments')} />
    </>}
  </View>;
}
