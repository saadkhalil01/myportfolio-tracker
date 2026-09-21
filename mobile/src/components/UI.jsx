import { Pressable, Text, TextInput, View } from 'react-native';
import { colors, styles as s } from '../theme';

export function Button({ title, onPress, secondary = false, disabled = false, danger = false }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.button, secondary && s.secondary, (disabled || pressed) && s.disabled]}>
    <Text style={[s.buttonText, secondary && s.secondaryText, danger && s.negative]}>{title}</Text>
  </Pressable>;
}

export function Field({ label, value, onChangeText, numeric = false, ...props }) {
  return <View style={s.field}>
    <Text style={s.muted}>{label}</Text>
    <TextInput accessibilityLabel={label} style={s.input} value={String(value ?? '')} onChangeText={onChangeText}
      keyboardType={numeric ? 'decimal-pad' : 'default'} placeholderTextColor={colors.muted}
      autoCorrect={false} {...props} />
  </View>;
}

export function Metric({ label, value, positive }) {
  return <View style={s.grow}>
    <Text style={s.muted}>{label}</Text>
    <Text style={[s.number, positive === true && s.positive, positive === false && s.negative]}>{value}</Text>
  </View>;
}
