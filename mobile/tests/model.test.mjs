import test from 'node:test';
import assert from 'node:assert/strict';
import { editHolding, editPortfolio, emptyData, holdingInput, holdingValues, normalizeData, portfolioInput, totals } from '../src/lib/model.mjs';

test('holding edits preserve unrelated web data, dividends and custom metadata', () => {
  const source = { ...emptyData(), liabilities: [{ id: 'loan', amount: 300 }], extra: { future: true },
    portfolios: [{ id: 'p', name: 'Income', cash: 200, holdings: [{ id: 'h', name: 'EFERT', shares: 10, avgBuy: 100,
      category: 'fertilizers', customColor: '#00aabb', customField: 'keep', upcomingDividend: { amountPerShare: 5 } }] }] };
  const edited = editHolding(source, 'p', 'h', { shares: 20 });
  assert.equal(edited.portfolios[0].holdings[0].shares, 20);
  assert.equal(source.portfolios[0].holdings[0].shares, 10);
  assert.deepEqual(edited.liabilities, source.liabilities);
  assert.deepEqual(edited.extra, source.extra);
  assert.equal(edited.portfolios[0].holdings[0].customField, 'keep');
  assert.deepEqual(edited.portfolios[0].holdings[0].upcomingDividend, source.portfolios[0].holdings[0].upcomingDividend);
});

test('legacy holding migration runs once and preserves additional fields', () => {
  const source = { portfolios: [{ id: 'p', name: 'Legacy', note: 'retain', holdings: [{ id: 'h', name: 'MTL', shares: 100, avgBuy: 10, extra: 'retain' }] }] };
  const result = normalizeData(source);
  assert.equal(result.portfolios[0].holdings[0].shares, 10);
  assert.equal(result.portfolios[0].holdings[0].avgBuy, 100);
  assert.equal(result.portfolios[0].note, 'retain');
  assert.equal(result.portfolios[0].holdings[0].extra, 'retain');
  assert.equal(normalizeData(result).portfolios[0].holdings[0].shares, 10);
});

test('valuations use normalized ticker prices, include cash once and fall back to cost', () => {
  const portfolios = [{ cash: 200, holdings: [{ name: ' efert.pk ', shares: 10, avgBuy: 100 }, { name: 'MTL', shares: 2, avgBuy: 50 }] }];
  assert.deepEqual(totals(portfolios, { EFERT: { price: 120 } }), { invested: 1300, value: 1500, cash: 200, profit: 200 });
  assert.equal(holdingValues(portfolios[0].holdings[1], {}).live, false);
  assert.equal(holdingValues(portfolios[0].holdings[0], { EFERT: { price: 0 } }).price, 0);
});

test('forms reject missing, negative and nonfinite amounts', () => {
  for (const shares of ['', '-1', 'Infinity', 'NaN', '0']) {
    assert.throws(() => holdingInput({ name: 'EFERT', shares, avgBuy: '100' }));
  }
  assert.throws(() => portfolioInput({ name: ' ', broker: '', cash: '0' }));
  assert.throws(() => portfolioInput({ name: 'Growth', broker: '', cash: '-1' }));
  assert.deepEqual(holdingInput({ name: ' hubc.pk ', shares: '1,000', avgBuy: '200.5' }), { name: 'HUBC', shares: 1000, avgBuy: 200.5 });
});

test('new portfolios and holdings retain the web schema', () => {
  const withPortfolio = editPortfolio(emptyData(), 'new', { name: 'Growth', broker: 'Broker', cash: 100 });
  const result = editHolding(withPortfolio, 'new', 'stock', { name: 'PSO', shares: 2, avgBuy: 100 });
  assert.equal(result.portfolios.find((p) => p.id === 'new').holdings[0].category, '');
  assert.equal(result.portfolios.find((p) => p.id === 'new').strategy, 'mixed');
  assert.equal(result.holdingFieldsFixed, true);
});
