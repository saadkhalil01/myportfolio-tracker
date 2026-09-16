import AppIcon from './AppIcon.jsx';

export const STOCK_CATEGORIES = [
  { id: 'tractor', label: 'Tractor' },
  { id: 'tyre', label: 'Tyre' },
  { id: 'transportation', label: 'Transportation' },
  { id: 'fuel', label: 'Fuel' },
  { id: 'oilGas', label: 'Oil & gas' },
  { id: 'plants', label: 'Plants' },
  { id: 'soil', label: 'Soil' },
  { id: 'fertilizers', label: 'Fertilizers' },
  { id: 'sprout', label: 'Sprout' },
  { id: 'engine', label: 'Engine' },
  { id: 'cars', label: 'Cars' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'chemicals', label: 'Chemicals' },
  { id: 'waving', label: 'Waving' },
  { id: 'cement', label: 'Cement bag' },
  { id: 'banks', label: 'Banks' },
  { id: 'merchantAccounts', label: 'Merchant accounts' },
];

export default function StockCategorySelect({ value = '', stockName, color, onChange }) {
  const selected = STOCK_CATEGORIES.find((category) => category.id === value);

  return (
    <label
      className={`stock-category-select${selected ? ' has-category' : ''}`}
      title={selected?.label || `Assign a category to ${stockName || 'stock'}`}
      style={selected ? { '--stock-icon-color': color } : undefined}
    >
      <AppIcon name={selected?.id || 'stocks'} size={18} />
      <span>{selected?.label || 'Category'}</span>
      <select
        value={value}
        aria-label={`Category for ${stockName || 'stock'}`}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose category</option>
        {STOCK_CATEGORIES.map((category) => (
          <option key={category.id} value={category.id}>{category.label}</option>
        ))}
      </select>
    </label>
  );
}
