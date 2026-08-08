export const INVESTMENT_CATEGORY_OPTIONS = [
  { name: 'Stock', color: '#dcfce7' },
  { name: 'Mutual Fund (Low Risk)', color: '#dbeafe' },
  { name: 'Mutual Fund (High Risk)', color: '#fee2e2' },
  { name: 'Gold', color: '#fef3c7' },
  { name: 'Forex', color: '#e0e7ff' },
  { name: 'Crypto', color: '#ffedd5' },
  { name: 'Real Estate', color: '#e5e7eb' },
  { name: 'Bonds', color: '#e2e8f0' },
  { name: 'Savings Account', color: '#dbeafe' },
  { name: 'Pension', color: '#f3e8ff' },
  { name: 'Custom Category', color: '#f1f5f9', custom: true },
];

const CATEGORY_COLOR_RULES = [
  { pattern: /^stocks?$/i, color: '#dcfce7', chartColor: '#16a34a' },
  { pattern: /mutual\s*fund.*low\s*risk/i, color: '#dbeafe', chartColor: '#2563eb' },
  { pattern: /mutual\s*fund.*high\s*risk/i, color: '#fee2e2', chartColor: '#dc2626' },
  { pattern: /savings?\s*(account)?/i, color: '#dbeafe', chartColor: '#2563eb' },
  { pattern: /crypto/i, color: '#ffedd5', chartColor: '#f59e0b' },
  { pattern: /gold/i, color: '#fef3c7', chartColor: '#ca8a04' },
  { pattern: /real\s*estate/i, color: '#e5e7eb', chartColor: '#64748b' },
  { pattern: /pension/i, color: '#f3e8ff', chartColor: '#9333ea' },
  { pattern: /forex/i, color: '#e0e7ff', chartColor: '#4f46e5' },
  { pattern: /bonds?/i, color: '#e2e8f0', chartColor: '#475569' },
];

export function categoryColor(category) {
  if (/^#[0-9a-f]{6}$/i.test(String(category?.customColor || ''))) {
    return category.customColor;
  }
  const name = String(category?.name || '').trim();
  const rule = CATEGORY_COLOR_RULES.find(({ pattern }) => pattern.test(name));
  return rule?.color || category?.color || '#f1f5f9';
}

export function categoryChartColor(category) {
  if (/^#[0-9a-f]{6}$/i.test(String(category?.customColor || ''))) {
    return category.customColor;
  }
  const name = String(category?.name || '').trim();
  const rule = CATEGORY_COLOR_RULES.find(({ pattern }) => pattern.test(name));
  return rule?.chartColor || '#64748b';
}
