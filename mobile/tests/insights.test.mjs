import test from 'node:test';
import assert from 'node:assert/strict';
import { portfolioHealth } from '../src/lib/health.mjs';
import { emptyData, holdingInput, editHolding, normalizeData } from '../src/lib/model.mjs';
import { upcomingDividendEntries } from '../../src/stockDividends.js';

test('health handles empty assets and savings overrides using web weights', () => {
  assert.equal(portfolioHealth(emptyData()).score, 0);
  const data = { ...emptyData(), categories: [
    { id: 'cash', name: 'Savings account', invested: 100, currentValue: 100, isSavings: false },
    { id: 'fund', name: 'Fund', invested: 100, currentValue: 100, isSavings: true },
    { id: 'gold', name: 'Gold', invested: 100, currentValue: 100 },
    { id: 'land', name: 'Land', invested: 100, currentValue: 100 },
  ] };
  const health = portfolioHealth(data);
  assert.equal(health.score, 88);
  assert.equal(health.factors[1].score, 100);
  assert.equal(health.savingsGap, 0);
  data.categories[1].isSavings = false;
  assert.equal(portfolioHealth(data).score, 63);
});

test('dividend edits survive hydration and calculate after-tax payments', () => {
  const holding = holdingInput({ name: 'EFERT', shares: 10, avgBuy: 100,
    upcomingDividend: { paymentDate: '2026-10-10', perShare: '5' } });
  const data = { ...emptyData(), portfolios: [{ id: 'p', name: 'Income', cash: 0, holdings: [{ id: 'h', ...holding }] }] };
  const entry = upcomingDividendEntries(normalizeData(data).portfolios, '2026-10-01', 15)[0];
  assert.equal(entry.expectedAfterTax, 42.5);
  assert.equal(upcomingDividendEntries(data.portfolios, '2026-10-11', 15).length, 0);
  const cleared = editHolding(data, 'p', 'h', holdingInput({ ...holding, upcomingDividend: { paymentDate: '', perShare: 0 } }));
  assert.equal(upcomingDividendEntries(cleared.portfolios, '2026-10-01').length, 0);
  assert.throws(() => holdingInput({ ...holding, upcomingDividend: { paymentDate: '2026-02-30', perShare: 5 } }));
  assert.throws(() => holdingInput({ ...holding, upcomingDividend: { paymentDate: '', perShare: -1 } }));
});
