import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, editRecord, recordInput, wealth, recordValuation, normalizeData, parseBackup, targetFunds } from '../src/lib/model.mjs';

const fixture = () => ({ ...emptyData(), categories: [
  { id: 'stocks', name: 'Stocks', invested: 100, currentValue: 999 },
  { id: 'savings', name: 'Savings', invested: 200, currentValue: 250 },
  { id: 'pension', name: 'Pension', invested: 50, currentValue: 60 },
], liabilities: [{ id: 'loan', name: 'Loan', amount: 20 }],
portfolios: [{ id: 'p', name: 'Broker', broker: '', cash: 10, holdings: [{ id: 'h', name: 'EFERT', shares: 1, avgBuy: 100 }] }] });

test('whole-account totals do not double count stock category and target funds exclude pension', () => {
  const data = fixture();
  const quotes = { EFERT: { price: 150 } };
  assert.equal(wealth(data, quotes).valuation, 470);
  assert.equal(wealth(data, quotes).net, 450);
  assert.equal(targetFunds(data, quotes), 410);
});

test('record updates preserve unrelated fields and do not mutate original', () => {
  const data = fixture();
  data.categories[1].isSavings = true;
  const edited = editRecord(data, 'categories', 'savings', { currentValue: 300 });
  assert.equal(edited.categories[1].isSavings, true);
  assert.equal(data.categories[1].currentValue, 250);
  assert.deepEqual(edited.portfolios, data.portfolios);
});

test('target inputs reject invalid years, multipliers and amounts', () => {
  const form = { name: 'Car', year: '2030', buyMultiplier: '2', targetAmount: '1,000' };
  assert.equal(recordInput('targets', form).targetAmount, 1000);
  for (const patch of [{ year: '0' }, { year: '2026.5' }, { buyMultiplier: '0' }, { buyMultiplier: '1.5' }, { targetAmount: '-1' }]) {
    assert.throws(() => recordInput('targets', { ...form, ...patch }));
  }
});

test('valuation records live wealth once per day and survives normalization', () => {
  const data = recordValuation(fixture(), { EFERT: { price: 150 } });
  const again = recordValuation(data, { EFERT: { price: 160 } });
  assert.equal(again.valuationHistory.length, data.valuationHistory.length);
  assert.equal(again.valuationHistory.at(-1).valuation, 480);
  assert.deepEqual(normalizeData(again).valuationHistory, again.valuationHistory);
});

test('backup round trips and rejects malformed or dangerous replacements', () => {
  const data = fixture();
  assert.deepEqual(parseBackup(JSON.stringify(data)).portfolios, data.portfolios.map((p) => ({ ...p, strategy: 'mixed', goal: '', holdings: p.holdings.map((h) => ({ ...h, category: '' })) })));
  for (const value of [null, [], {}, { categories: [null] }, { portfolios: [{ holdings: [null] }] }, { categories: [], valuationHistory: [null] }]) {
    assert.throws(() => parseBackup(JSON.stringify(value)));
  }
});
