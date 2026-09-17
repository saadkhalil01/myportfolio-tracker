import { normalizeSymbol } from './psxQuotes.js';

const STOCK_COLORS = ['#28aa91', '#57b95f', '#7554be', '#f29125', '#e23e45', '#d84c9b', '#278fa2', '#78838c'];

export function stockColor(holding) {
  if (/^#[0-9a-f]{6}$/i.test(String(holding?.customColor || ''))) return holding.customColor;
  const name = normalizeSymbol(holding?.name);
  const hash = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return STOCK_COLORS[hash % STOCK_COLORS.length];
}

