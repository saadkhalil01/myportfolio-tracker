import { useState } from 'react';
import { Text, View } from 'react-native';
import { styles as s } from '../theme';
import { Button, Field } from './UI';

export default function DividendFields({ form, setForm }) {
  const dividend = form.upcomingDividend || {};
  const [expanded, setExpanded] = useState(Boolean(dividend.paymentDate || dividend.perShare));
  const update = (patch) => setForm((previous) => ({ ...previous,
    upcomingDividend: { ...previous.upcomingDividend, ...patch },
  }));
  return <View style={{ gap: 12 }}>
    <Button title={expanded ? 'Hide dividend details' : '+ Announced dividend (optional)'} secondary expanded={expanded}
      onPress={() => setExpanded(!expanded)} />
    {expanded && <>
    <Text style={s.muted}>Record the next announced payment for this holding.</Text>
    <Field label="Payment date · YYYY-MM-DD" value={dividend.paymentDate} maxLength={10}
      onChangeText={(paymentDate) => update({ paymentDate })} />
    <Field label="Dividend per share · PKR" numeric value={dividend.perShare}
      onChangeText={(perShare) => update({ perShare })} />
    <Button title="Clear dividend" secondary onPress={() => update({ paymentDate: '', perShare: 0 })} />
    </>}
  </View>;
}
