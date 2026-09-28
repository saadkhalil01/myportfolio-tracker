import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { randomUUID } from 'expo-crypto';
import { editRecord, recordFields, recordInput } from '../lib/model.mjs';
import { styles as s } from '../theme';
import { Button, Field } from './UI';

export default function RecordEditor({ target, store, close }) {
  const { kind, item } = target;
  const [form, setForm] = useState(item || { name: '', invested: '0', currentValue: '0', amount: '0', targetAmount: '0', year: String(new Date().getFullYear() + 1), buyMultiplier: '1' });
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const save = async (remove = false) => {
    try {
      const values = remove ? null : recordInput(kind, form);
      const id = item?.id || randomUUID();
      const ok = await store.update((data) => remove
        ? { ...data, [kind]: data[kind].filter((row) => row.id !== id) }
        : editRecord(data, kind, id, values));
      if (ok) close(); else setError('Could not save. Please retry.');
    } catch (problem) { setError(problem.message); }
  };
  return <Modal animationType="slide" onRequestClose={() => { if (!store.busy) close(); }}>
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={s.grow} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.between}><Text style={s.heading}>{item ? 'Edit' : 'Add'} record</Text><Button title="Cancel" secondary disabled={store.busy} onPress={close} /></View>
          {recordFields[kind].map(([key, label, numeric]) => <Field key={key} label={label} numeric={numeric} value={form[key]}
            onChangeText={(value) => setForm((prev) => ({ ...prev, [key]: value }))} />)}
          {error ? <Text accessibilityRole="alert" style={[s.text, s.negative]}>{error}</Text> : null}
          <Button title={store.busy ? 'Saving…' : 'Save'} disabled={store.busy} onPress={() => save()} />
          {item && <Button title="Delete" secondary danger disabled={store.busy} onPress={() => setDeleting(true)} />}
          {deleting && <View style={s.card}><Text style={s.text}>Delete {item.name}? This also updates your synced account.</Text>
            <Button title="Confirm delete" secondary danger disabled={store.busy} onPress={() => save(true)} />
            <Button title="Keep it" secondary onPress={() => setDeleting(false)} /></View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
