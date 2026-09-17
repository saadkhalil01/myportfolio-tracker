import AppIcon from './AppIcon.jsx';
import { STOCK_CATEGORIES } from './StockCategorySelect.jsx';

export default function StockCategoryIcon({ category, color, size = 18 }) {
  const selected = STOCK_CATEGORIES.find((item) => item.id === category);
  if (!selected) return null;
  return (
    <span className="stock-category-icon" style={{ color }} title={selected.label}>
      <AppIcon name={selected.id} size={size} />
      <span className="sr-only">{selected.label}</span>
    </span>
  );
}
