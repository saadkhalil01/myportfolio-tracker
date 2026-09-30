import { Text } from 'react-native';

const icons = {
  overview: '◕',
  growth: '↗',
  investments: '▣',
  liabilities: '−',
  targets: '◎',
  stocks: '▥',
};

export default function SketchyIcon({ name, size = 28, color }) {
  return <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ color, fontSize: size, lineHeight: size + 4, fontWeight: '600', textAlign: 'center' }}>
    {icons[name] || icons.investments}
  </Text>;
}
