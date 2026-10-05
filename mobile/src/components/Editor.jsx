import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { randomUUID } from 'expo-crypto';
import { editHolding, editPortfolio, holdingInput, portfolioInput } from '../lib/model.mjs';
import DividendFields from './DividendFields';
import { styles as s } from '../theme';
import { Button, Field } from './UI';

export default function Editor({ target, store, close }) {
  const isHolding = target.kind === 'holding';
  const existing = isHolding ? target.holding : target.portfolio;
  const [form, setForm] = useState(existing || (isHolding ? { name: '', shares: '', avgBuy: '' } : { name: '', broker: '', cash: '0' }));
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const field = (name) => (value) => setForm((prev) => ({ ...prev, [name]: value }));
  const save = async () => {
    try {
      const values = isHolding ? holdingInput(form) : portfolioInput(form);
      const id = existing?.id || randomUUID();
      const ok = await store.update((data) => isHolding
        ? editHolding(data, target.portfolio.id, id, values) : editPortfolio(data, id, values));
      if (ok) close(); else setError('Could not save. Your form is still here; please retry.');
    } catch (problem) { setError(problem.message); }
  };
  const remove = async () => {
    const ok = await store.update((data) => ({ ...data, portfolios: isHolding
      ? data.portfolios.map((p) => p.id !== target.portfolio.id ? p : { ...p, holdings: p.holdings.filter((h) => h.id !== existing.id) })
      : data.portfolios.filter((p) => p.id !== existing.id),
    }));
    if (ok) close(); else setError('Could not remove this item. Please retry.');
  };
  return <Modal animationType="slide" onRequestClose={() => { if (!store.busy) close(); }}>
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={s.grow} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: 24 }]} keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
          <View style={s.between}>
            <Text style={s.heading}>{existing ? 'Edit' : 'Add'} {isHolding ? 'stock' : 'portfolio'}</Text>
            <Button title="Cancel" secondary disabled={store.busy} onPress={close} />
          </View>
          <Field label={isHolding ? 'PSX symbol' : 'Portfolio name'} value={form.name} onChangeText={field('name')}
            autoCapitalize={isHolding ? 'characters' : 'words'} maxLength={isHolding ? 20 : 80} />
          {isHolding ? <>
            <Field label="Shares" numeric value={form.shares} onChangeText={field('shares')} />
            <Field label="Average buy price · PKR" numeric value={form.avgBuy} onChangeText={field('avgBuy')} />
            <DividendFields form={form} setForm={setForm} />
            <Text style={s.muted}>Editing a holding updates its recorded position. Available cash is edited separately.</Text>
          </> : <>
            <Field label="Broker" value={form.broker} onChangeText={field('broker')} />
            <Field label="Available cash · PKR" numeric value={form.cash} onChangeText={field('cash')} />
          </>}
          {existing && <Button title="Delete" secondary danger disabled={store.busy} onPress={() => setDeleting(true)} />}
          {deleting && <View style={s.card}>
            <Text style={s.text}>Delete {existing.name}{!isHolding ? ' and all its holdings' : ''}? This also updates your synced account.</Text>
            <Button title="Confirm delete" secondary danger disabled={store.busy} onPress={remove} />
            <Button title="Keep it" secondary disabled={store.busy} onPress={() => setDeleting(false)} />
          </View>}
        </ScrollView>
        <View style={s.editorFooter}>
          {error ? <Text accessibilityRole="alert" style={[s.text, s.negative]}>{error}</Text> : null}
          <Button title={store.busy ? 'Saving…' : (existing ? 'Save changes' : isHolding ? 'Add stock' : 'Create portfolio')} disabled={store.busy} onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
