import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { money, wealth } from '../lib/model.mjs';
import { styles as s } from '../theme';
import { Button, Field } from './UI';

export default function HomeSummary({ data, quotes, store }) {
  const assets = wealth(data, quotes);
  const [editing, setEditing] = useState(false);
  const change = assets.invested > 0 ? assets.profit / assets.invested * 100 : 0;
  const yieldPct = assets.invested > 0 ? Number(data.dividendReinvested || 0) / assets.invested * 100 : 0;
  return <>
    <View style={[s.homeStat, s.homePrimary]}><Text style={s.homeLabel}>CURRENT VALUE</Text>
      <Text style={s.homeValue} numberOfLines={1} adjustsFontSizeToFit>{money(assets.valuation)}</Text></View>
    <View style={s.homeGrid}>
      <View style={[s.homeStat, s.grow, s.homeInvested]}><Text style={s.homeLabel}>TOTAL INVESTED</Text>
        <Text style={s.homeValue} numberOfLines={1} adjustsFontSizeToFit>{money(assets.invested)}</Text></View>
      <View style={[s.homeStat, s.grow]}><Text style={s.homeLabel}>CHANGE</Text>
        <Text style={[s.homeValue, assets.profit >= 0 ? s.positive : s.negative]} numberOfLines={1} adjustsFontSizeToFit>{assets.profit >= 0 ? '+' : ''}{money(assets.profit)}</Text>
        <Text style={[s.text, assets.profit >= 0 ? s.positive : s.negative]}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</Text></View>
    </View>
    <View style={s.homeGrid}>
      <EditableStat label="DIVIDEND REINVESTED" value={money(data.dividendReinvested)} disabled={store.busy}
        detail={`Yield on cost ${yieldPct.toFixed(2)}%`} onPress={() => setEditing(true)} />
      <EditableStat label="START DATE" value={data.startDate ? `${data.startDate.slice(5, 7)}/${data.startDate.slice(8, 10)}/${data.startDate.slice(0, 4)}` : 'Set date'} disabled={store.busy}
        onPress={() => setEditing(true)} />
    </View>
    {editing && <DetailsEditor data={data} store={store} close={() => setEditing(false)} />}
  </>;
}

function EditableStat({ label, value, detail, onPress, disabled }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${label.toLowerCase()}`} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [s.homeStat, s.grow, pressed && s.pressed]}>
    <Text style={s.homeLabel}>{label}</Text>
    <View style={s.homeStatInput}><Text style={s.number} numberOfLines={1} adjustsFontSizeToFit>{value}</Text></View>
    {detail && <Text style={s.muted}>{detail}</Text>}
  </Pressable>;
}

function DetailsEditor({ data, store, close }) {
  const [dividend, setDividend] = useState(String(data.dividendReinvested || 0));
  const [date, setDate] = useState(data.startDate || '');
  const [error, setError] = useState('');
  const save = async () => {
    const amount = Number(dividend.replace(/,/g, ''));
    const parsed = new Date(`${date}T12:00:00Z`);
    if (!dividend.trim() || !Number.isFinite(amount) || amount < 0) { setError('Enter a dividend amount of zero or more.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) { setError('Enter a valid start date as YYYY-MM-DD.'); return; }
    const ok = await store.update((current) => ({ ...current, dividendReinvested: amount, startDate: date }));
    if (ok) close(); else setError('Could not save. Please retry.');
  };
  return <Modal animationType="slide" onRequestClose={() => !store.busy && close()}>
    <SafeAreaView style={s.screen}><View style={s.content}>
      <Text style={s.heading}>Portfolio details</Text>
      <Field label="Dividend reinvested · PKR" numeric value={dividend} onChangeText={setDividend} />
      <Field label="Start date · YYYY-MM-DD" value={date} onChangeText={setDate} maxLength={10} />
      {error ? <Text accessibilityRole="alert" style={s.negative}>{error}</Text> : null}
      <Button title="Save changes" disabled={store.busy} onPress={save} />
      <Button title="Cancel" secondary disabled={store.busy} onPress={close} />
    </View></SafeAreaView>
  </Modal>;
}
