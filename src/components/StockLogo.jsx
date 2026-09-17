import { useEffect, useMemo, useState } from 'react';
import StockCategoryIcon from './StockCategoryIcon.jsx';
import { STOCK_CATEGORIES } from './StockCategorySelect.jsx';
import { logoCandidates, normalizeSymbol } from '../psxLogos.js';

export default function StockLogo({ name, category, color, size = 28 }) {
  const symbol = normalizeSymbol(name);
  const candidates = useMemo(() => logoCandidates(name), [name]);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [name]);

  const letter = symbol.slice(0, 2) || '?';
  const src = !failed && candidates[index] ? candidates[index] : null;

  if (STOCK_CATEGORIES.some((item) => item.id === category)) {
    return (
      <span className="stock-logo stock-logo-fallback" style={{ width: size, height: size }}>
        <StockCategoryIcon category={category} color={color} size={size * 0.65} />
      </span>
    );
  }

  if (!src) {
    return (
      <span
        className="stock-logo stock-logo-fallback"
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
        aria-hidden="true"
        title={symbol || 'Stock'}
      >
        {letter}
      </span>
    );
  }

  return (
    <img
      className="stock-logo"
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (index + 1 < candidates.length) setIndex((i) => i + 1);
        else setFailed(true);
      }}
    />
  );
}
