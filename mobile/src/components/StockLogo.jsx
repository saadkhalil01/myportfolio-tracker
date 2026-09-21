import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { logoCandidates, normalizeSymbol } from '../../../src/psxLogos.js';
import { API_URL } from '../lib/config';
import { styles as s } from '../theme';

export default function StockLogo({ name }) {
  return <LogoImage key={normalizeSymbol(name)} name={name} />;
}

function LogoImage({ name }) {
  const [index, setIndex] = useState(0);
  const candidates = logoCandidates(name).map((url) => url.startsWith('/') ? `${API_URL}${url}` : url);
  if (!candidates[index]) return <View style={s.logoFallback}><Text style={s.text}>{normalizeSymbol(name).slice(0, 2) || '?'}</Text></View>;
  return <Image accessibilityLabel={`${name} logo`} source={{ uri: candidates[index] }} style={s.logo}
    resizeMode="contain" onError={() => setIndex((current) => current + 1)} />;
}
