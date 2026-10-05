import { isSavingsInvestment } from '../../../src/investmentClassification.js';
import { wealth } from './model.mjs';

const clamp = (value) => Math.min(100, Math.max(0, value));
export function portfolioHealth(data, quotes = {}) {
  const { valuation: assets, invested, liabilities } = wealth(data, quotes);
  const savings = data.categories.filter(isSavingsInvestment).reduce((sum, item) => sum + Number(item.currentValue || 0), 0);
  const funded = data.categories.filter((item) => Number(item.currentValue || 0) > 0).length;
  const returnPct = invested > 0 ? (assets - invested) / invested * 100 : 0;
  const bufferTarget = liabilities > 0 ? liabilities : assets * 0.2;
  const factors = [
    { name: 'Debt coverage', weight: 35, score: assets <= 0 ? 0 : liabilities <= 0 ? 100 : clamp(assets / liabilities / 3 * 100),
      detail: liabilities > 0 ? `${(assets / liabilities).toFixed(1)}× assets to liabilities` : 'No liabilities' },
    { name: 'Savings buffer', weight: 25, score: assets <= 0 ? 0 : clamp(savings / bufferTarget * 100), detail: `PKR ${savings.toLocaleString('en-PK')} in savings` },
    { name: 'Investment performance', weight: 25, score: invested > 0 ? clamp(50 + returnPct * 2.5) : 0, detail: `${returnPct.toFixed(1)}% portfolio return` },
    { name: 'Diversification', weight: 15, score: clamp(funded / 4 * 100), detail: `${funded} funded categories` },
  ];
  const score = Math.round(factors.reduce((sum, factor) => sum + factor.score * factor.weight / 100, 0));
  return { score, factors, savingsGap: Math.max(0, bufferTarget - savings),
    label: score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Needs attention' };
}
