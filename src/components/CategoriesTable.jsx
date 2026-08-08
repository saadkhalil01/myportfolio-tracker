import { useState } from 'react';
import {
  fmt,
  fmtPct,
  uid,
  isStocksCategory,
  isGoldCategory,
  numberInputValue,
} from '../storage.js';
import { categoryColor, INVESTMENT_CATEGORY_OPTIONS } from '../categoryColors.js';
import { isSavingsInvestment } from '../investmentClassification.js';

export default function CategoriesTable({
  categories,
  onChange,
  stocksLinked = false,
  goldRatePerTola = null,
  goldRatePerGram = null,
  goldRateStatus = 'idle',
  goldRateUpdatedAt = null,
}) {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [settingsCategoryId, setSettingsCategoryId] = useState(null);
  const settingsCategory = categories.find((category) => category.id === settingsCategoryId);

  const update = (id, field, value) => {
    onChange(
      categories.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  /** Single source of truth for gold: goldQuantity (+ unit) → invested & currentValue */
  const updateGoldHolding = (id, field, value) => {
    onChange(
      categories.map((category) => {
        if (category.id !== id) return category;
        const goldUnit = field === 'goldUnit' ? value : category.goldUnit || 'tola';
        const quantityRaw =
          field === 'goldQuantity' ? value : category.goldQuantity ?? category.goldTolas ?? 1;
        const goldQuantity = quantityRaw === '' ? '' : Math.max(0, Number(quantityRaw));
        const unitRate = goldUnit === 'gram' ? goldRatePerGram : goldRatePerTola;
        const currentValue = Math.round(Number(goldQuantity || 0) * Number(unitRate || 0));
        return {
          ...category,
          goldUnit,
          goldQuantity,
          goldInvestedAuto: true,
          invested: currentValue,
          currentValue,
        };
      })
    );
  };

  const addRow = (option) => {
    const isGold = option.name === 'Gold';
    const unitRate =
      isGold && goldRateStatus === 'ready' ? Number(goldRatePerTola || 0) : 0;
    const initialGoldValue = unitRate > 0 ? Math.round(unitRate) : 0;
    onChange([
      ...categories,
      {
        id: uid(),
        name: option.custom ? 'Custom Category' : option.name,
        color: option.color,
        ...(isGold
          ? {
              goldQuantity: 1,
              goldUnit: 'tola',
              goldInvestedAuto: true,
            }
          : {}),
        ...(/Savings Account|Mutual Fund \(Low Risk\)/i.test(option.name)
          ? { isSavings: true }
          : {}),
        invested: initialGoldValue,
        currentValue: initialGoldValue,
      },
    ]);
    setShowCategoryMenu(false);
  };

  const removeRow = (id) => {
    onChange(categories.filter((c) => c.id !== id));
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Investments</h2>
        <div className="category-add-controls">
          <button
            className="btn btn-ghost"
            aria-expanded={showCategoryMenu}
            aria-controls="investment-category-menu"
            onClick={() => setShowCategoryMenu((visible) => !visible)}
          >
            + Add category
          </button>
          {showCategoryMenu && (
            <div id="investment-category-menu" className="category-menu">
              <div className="category-menu-title">Choose a category</div>
              <div className="category-menu-grid">
                {INVESTMENT_CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.name}
                    className="category-option"
                    style={{ '--option-bg': option.color }}
                    onClick={() => addRow(option)}
                  >
                    <span className="category-option-dot" aria-hidden="true" />
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {stocksLinked && (
        <p className="card-note" style={{ marginTop: 0 }}>
          Stock current value is linked to Stocks insights (live market total + cash).
        </p>
      )}
      {categories.length === 0 ? (
        <p className="empty-note">No investments yet — use + Add category to create one.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th className="num">Invested</th>
              <th className="num">Current Value</th>
              <th className="num">Gain</th>
              <th className="num">Change %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => {
              const linked = stocksLinked && isStocksCategory(c);
              const goldLinked =
                isGoldCategory(c) &&
                goldRateStatus === 'ready' &&
                goldRatePerTola &&
                goldRatePerGram;
              const goldUnit = c.goldUnit === 'gram' ? 'gram' : 'tola';
              const goldUnitRate = goldUnit === 'gram' ? goldRatePerGram : goldRatePerTola;
              const rawGoldQuantity = c.goldQuantity ?? c.goldTolas ?? 1;
              const goldQuantity =
                rawGoldQuantity === ''
                  ? ''
                  : Number.isFinite(Number(rawGoldQuantity))
                    ? Number(rawGoldQuantity)
                    : 1;
              const gain = c.currentValue - c.invested;
              const pct = c.invested > 0 ? (gain / c.invested) * 100 : 0;
              const gainClass = gain > 0 ? 'positive' : gain < 0 ? 'negative' : '';
              return (
                <tr className="category-row" key={c.id} style={{ '--category-bg': categoryColor(c) }}>
                  <td>
                    <div className="category-name-wrap">
                      <label className="category-color-picker-wrap" title={`Choose color for ${c.name || 'category'}`}>
                        <input
                          className="category-color-picker"
                          type="color"
                          value={categoryColor(c)}
                          aria-label={`Choose color for ${c.name || 'investment category'}`}
                          onChange={(event) => update(c.id, 'customColor', event.target.value)}
                        />
                      </label>
                      <input
                        className="cell-input name category-name-input"
                        value={c.name}
                        onChange={(e) => update(c.id, 'name', e.target.value)}
                      />
                    </div>
                  </td>
                  <td className="num">
                    {goldLinked ? (
                      <span className="gold-invested-qty" title="Same as gold quantity (tola/gram)">
                        <input
                          className="cell-input num"
                          aria-label="Gold quantity"
                          type="number"
                          min="0"
                          step="0.01"
                          value={goldQuantity}
                          onChange={(event) =>
                            updateGoldHolding(c.id, 'goldQuantity', event.target.value)
                          }
                        />
                        <span className="gold-invested-unit">{goldUnit}</span>
                      </span>
                    ) : (
                      <input
                        className="cell-input num"
                        type="number"
                        value={c.invested}
                        onChange={(e) => update(c.id, 'invested', numberInputValue(e.target.value))}
                      />
                    )}
                  </td>
                  <td className="num">
                    {linked ? (
                      <span className="linked-value" title="From Stocks insights">
                        {fmt(c.currentValue)}
                        <span className="linked-tag">from Stocks</span>
                      </span>
                    ) : goldLinked ? (
                      <span
                        className="linked-value gold-linked-value"
                        title={
                          goldRateUpdatedAt
                            ? `Updated ${new Date(goldRateUpdatedAt).toLocaleString()}`
                            : 'Live Pakistan gold rate'
                        }
                      >
                        {fmt(c.currentValue)}
                        <span className="gold-tola-control">
                          <input
                            aria-label="Gold quantity"
                            type="number"
                            min="0"
                            step="0.01"
                            value={goldQuantity}
                            onChange={(event) =>
                              updateGoldHolding(c.id, 'goldQuantity', event.target.value)
                            }
                          />
                          <select
                            aria-label="Gold weight unit"
                            value={goldUnit}
                            onChange={(event) =>
                              updateGoldHolding(c.id, 'goldUnit', event.target.value)
                            }
                          >
                            <option value="gram">gram</option>
                            <option value="tola">tola</option>
                          </select>
                          × {fmt(goldUnitRate)} PKR/{goldUnit}
                        </span>
                        <span className="linked-tag gold-linked-tag">24K live Pakistan rate</span>
                      </span>
                    ) : (
                      <input
                        className="cell-input num"
                        type="number"
                        value={c.currentValue}
                        onChange={(e) => update(c.id, 'currentValue', numberInputValue(e.target.value))}
                      />
                    )}
                  </td>
                  <td className={`num ${gainClass}`}>
                    {gain >= 0 ? '+' : ''}
                    {fmt(gain)}
                  </td>
                  <td className={`num ${gainClass}`}>{fmtPct(pct)}</td>
                  <td className="row-actions">
                    <button
                      className="btn-icon category-more-btn"
                      title="Investment options"
                      aria-label={`More options for ${c.name || 'investment'}`}
                      onClick={() => setSettingsCategoryId(c.id)}
                    >
                      ⋮
                    </button>
                    <button className="btn-icon" title="Remove" onClick={() => removeRow(c.id)}>
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {settingsCategory ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal investment-options-modal" role="dialog" aria-modal="true" aria-labelledby="investment-options-title">
            <div className="investment-options-head">
              <div>
                <span className="stat-label">Investment options</span>
                <h2 id="investment-options-title">{settingsCategory.name}</h2>
              </div>
              <button
                type="button"
                className="btn-icon modal-close-btn"
                aria-label="Close investment options"
                onClick={() => setSettingsCategoryId(null)}
              >
                ✕
              </button>
            </div>
            <label className="modal-savings-option">
              <input
                type="checkbox"
                checked={isSavingsInvestment(settingsCategory)}
                onChange={(event) =>
                  update(settingsCategory.id, 'isSavings', event.target.checked)
                }
              />
              <span>
                <strong>Count as savings</strong>
                <small>Include this investment in the Portfolio Health savings buffer.</small>
              </span>
            </label>
            <p className="investment-options-note">
              Savings Account, Emergency Funds, and Low-Risk Mutual Fund are selected by default.
              You can override that here.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setSettingsCategoryId(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
