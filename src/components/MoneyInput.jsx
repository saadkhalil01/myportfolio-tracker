import { useState } from 'react';

function formatAmount(n) {
  if (n === '' || n === null || n === undefined || Number.isNaN(Number(n))) return '';
  return Number(n).toLocaleString('en-PK', { maximumFractionDigits: 2 });
}

function parseAmount(raw) {
  const cleaned = String(raw).replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '-') return 0;
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

export default function MoneyInput({ value, onChange, className = '', ...props }) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      className={`cell-input num money-input ${className}`.trim()}
      value={focused ? draft : formatAmount(value)}
      onFocus={(e) => {
        setFocused(true);
        setDraft(value === 0 || value ? String(value) : '');
        requestAnimationFrame(() => e.target.select());
      }}
      onBlur={() => {
        setFocused(false);
        onChange(parseAmount(draft));
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw !== '' && !/^-?\d*\.?\d*$/.test(raw.replace(/,/g, ''))) return;
        setDraft(raw.replace(/,/g, ''));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}
