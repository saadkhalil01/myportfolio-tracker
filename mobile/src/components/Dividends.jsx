import { useState } from 'react';
import { Text, View } from 'react-native';
import { upcomingDividendEntries } from '../../../src/stockDividends.js';
import { todayISO } from '../../../src/storage.js';
import { money } from '../lib/model.mjs';
import { styles as s } from '../theme';
import { Button, Field } from './UI';

export default function Dividends({ data, edit, store, disabled }) {
  const tax = data.dividendTaxPercentage ?? 15;
  const [editingTax, setEditingTax] = useState(false);
  const [rate, setRate] = useState(String(tax));
  const [error, setError] = useState('');
  const saveTax = async () => {
    const value = Number(rate);
    if (!rate.trim() || !Number.isFinite(value) || value < 0 || value > 100) { setError('Enter a tax percentage from 0 to 100.'); return; }
    const ok = await store.update((current) => ({ ...current, dividendTaxPercentage: value }));
    if (ok) setEditingTax(false);
    setError(ok ? '' : 'Could not save tax percentage. Please retry.');
  };
  const entries = upcomingDividendEntries(data.portfolios, todayISO(), tax);
  const total = entries.reduce((sum, entry) => sum + entry.expectedAfterTax, 0);
  return <View style={s.card}>
    <Text style={s.heading}>Upcoming dividends</Text>
    <Text style={s.number}>PKR {money(total)} after tax</Text>
    <Text style={s.muted}>{tax}% tax · based on your current shares</Text>
    <Button title={editingTax ? 'Cancel tax edit' : 'Adjust tax rate'} secondary expanded={editingTax} disabled={disabled}
      onPress={() => { setRate(String(tax)); setError(''); setEditingTax(!editingTax); }} />
    {editingTax && <><Field label="Dividend tax percentage" numeric value={rate} onChangeText={setRate} />
    <Button title="Save tax percentage" secondary disabled={disabled} onPress={saveTax} /></>}
    {error ? <Text accessibilityRole="alert" style={s.negative}>{error}</Text> : null}
    {!entries.length && <Text style={s.muted}>No upcoming payments. Edit a holding to record an announced dividend.</Text>}
    {entries.map((entry) => <View key={`${entry.portfolio.id}:${entry.holding.id}`} style={[s.divider, { gap: 6 }]}>
      <View style={s.between}><Text style={s.number}>{entry.holding.name}</Text><Text style={s.number}>{money(entry.expectedAfterTax)}</Text></View>
      <Text style={s.muted}>{entry.portfolio.name} · {entry.paymentDate} · PKR {money(entry.perShare)} per share</Text>
      <Button title={`Edit ${entry.holding.name} dividend`} secondary disabled={disabled}
        onPress={() => edit({ kind: 'holding', portfolio: entry.portfolio, holding: entry.holding })} />
    </View>)}
  </View>;
}
