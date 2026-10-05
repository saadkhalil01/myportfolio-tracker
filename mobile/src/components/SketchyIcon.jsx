import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const icons = {
  overview: ['M12 3v9h9', 'M9 3.5a9 9 0 1 0 11.5 11.5', 'M15 3.5a9 9 0 0 1 5.5 5.5H15z'],
  growth: ['M4 20h16', 'M5 15l5-5 4 3 6-8', 'M15 5h5v5'],
  investments: ['M4 8h16v13H4z', 'M8 8V4h8v4', 'M4 13h16', 'M10 13v3h4v-3'],
  liabilities: ['M4 5h16v16H4z', 'M8 10h8', 'M8 15h5'],
  targets: ['M21 12a9 9 0 1 1-9-9', 'M17 12a5 5 0 1 1-5-5', 'M12 12l9-9', 'M17 3h4v4'],
  stocks: ['M4 20V11h4v9', 'M10 20V4h4v16', 'M16 20V8h4v12', 'M3 20h18'],
  account: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M4 21v-2a8 8 0 0 1 16 0v2'],
  menu: ['M8 5h13', 'M8 12h13', 'M8 19h13', 'M3 5h.01', 'M3 12h.01', 'M3 19h.01'],
  more: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
};

export default function SketchyIcon({ name, size = 28, color }) {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width={size} height={size} viewBox="0 0 24 24">
    {(icons[name] || icons.investments).map((d, index) => <Path key={index} d={d} fill="none"
      stroke={color} strokeWidth={name === 'more' ? 4 : 1.7} strokeLinecap="round" strokeLinejoin="round" />)}
    </Svg>
  </View>;
}
