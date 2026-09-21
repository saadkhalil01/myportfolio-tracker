import { useState } from 'react';
import { Share, Text, View } from 'react-native';
import { parseBackup } from '../lib/model.mjs';
import { styles as s } from '../theme';
import { Button, Field } from './UI';

export default function Backup({ store }) {
  const [text, setText] = useState('');
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState('');
  const exportBackup = async () => {
    const backup = JSON.stringify(store.data, null, 2);
    setText(backup); setPending(null);
    try { await Share.share({ title: 'MyPortfolio backup', message: backup }); }
    catch { setMessage('Your backup is ready below. Select and copy it to a safe location.'); }
  };
  const review = () => {
    try { setPending(parseBackup(text)); setMessage(''); }
    catch (problem) { setMessage(problem.message); }
  };
  const restore = async () => {
    if (await store.update(() => pending)) { setPending(null); setText(''); setMessage('Backup restored.'); }
    else setMessage('Restore failed. Please retry.');
  };
  return <View style={s.card}>
    <Text style={s.heading}>Backup & restore</Text>
    <Button title="Share JSON backup" secondary onPress={exportBackup} disabled={store.busy} />
    <Field label="Backup JSON · paste to restore or copy to save" value={text} multiline autoCapitalize="none"
      onChangeText={(value) => { setText(value); setPending(null); }} />
    <Button title="Review backup" secondary disabled={store.busy || !text.trim()} onPress={review} />
    {pending && <>
      <Text style={s.text}>Replace this portfolio with {pending.portfolios.length} portfolios, {pending.categories.length} investments, {pending.liabilities.length} liabilities and {pending.targets.length} targets? This also updates your synced account.</Text>
      <Button title="Replace with backup" danger secondary disabled={store.busy} onPress={restore} />
      <Button title="Cancel restore" secondary disabled={store.busy} onPress={() => setPending(null)} />
    </>}
    {message ? <Text accessibilityRole="alert" style={s.text}>{message}</Text> : null}
  </View>;
}
