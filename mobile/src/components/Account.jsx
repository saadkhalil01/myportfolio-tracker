import { useState } from 'react';
import { Text, View } from 'react-native';
import { styles as s } from '../theme';
import { Button } from './UI';

export default function Account({ auth, store }) {
  const [confirm, setConfirm] = useState(false);
  return <View style={s.card}>
    <Text style={s.heading}>{auth.user ? 'Your account' : 'Keep your portfolio with you'}</Text>
    <Text style={s.text}>{auth.user?.email || 'Sign in with the same Google account you use on the website.'}</Text>
    {!auth.configured && <Text style={s.muted}>Cloud sign-in is not configured in this build. You can still manage portfolios on this device.</Text>}
    <Button title={auth.busy ? 'Please wait…' : auth.user ? 'Sign out' : 'Sign in with Google'}
      disabled={auth.busy || store.busy || !auth.configured} onPress={auth.user ? auth.signOut : auth.signIn} />
    {auth.error ? <Text accessibilityRole="alert" style={s.negative}>{auth.error}</Text> : null}
    <Text style={s.muted}>{store.status}</Text>
    <Text style={s.muted}>Guest portfolios stay on this device and are separate from your signed-in account. Signing out keeps your account’s saved copy for your next sign-in.</Text>
    {auth.user && <Button title="Sync now" secondary disabled={store.busy} onPress={() => store.refresh()} />}
    {store.conflict && <>
      <Button title="Load cloud copy" secondary disabled={store.busy} onPress={() => setConfirm(true)} />
      {confirm && <>
        <Text style={s.text}>Discard this device’s unsynced changes and load the current cloud portfolio?</Text>
        <Button title="Discard local changes" secondary danger disabled={store.busy}
          onPress={async () => { await store.refresh(true); setConfirm(false); }} />
        <Button title="Keep local changes" secondary onPress={() => setConfirm(false)} />
      </>}
    </>}
  </View>;
}
