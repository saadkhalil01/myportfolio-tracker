import { Text, View } from 'react-native';
import { colors, styles as s } from '../theme';
import SketchyIcon from './SketchyIcon';
import { Button } from './UI';

export default function EmptyState({ icon = 'investments', title, description, action, onPress, disabled }) {
  return <View style={s.emptyState}>
    <View style={s.emptyIcon}><SketchyIcon name={icon} size={28} color={colors.accent} /></View>
    <Text style={[s.heading, s.centeredText]}>{title}</Text>
    <Text style={[s.muted, s.centeredText]}>{description}</Text>
    {action && <Button title={action} onPress={onPress} disabled={disabled} />}
  </View>;
}
