export function normalizeUpcomingDividend(value) {
  const date = String(value?.paymentDate || '');
  const parsed = new Date(`${date}T12:00:00Z`);
  const paymentDate = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : '';
  const amount = Number(value?.perShare || 0);
  return {
    paymentDate,
    perShare: Number.isFinite(amount) && amount > 0 ? amount : 0,
  };
}

export function upcomingDividendEntries(portfolios, today, taxPercentage = 15) {
  const tax = Number(taxPercentage || 0);
  const rate = Number.isFinite(tax) ? Math.min(100, Math.max(0, tax)) : 0;
  return portfolios.flatMap((portfolio) => (portfolio.holdings || []).map((holding) => {
    const dividend = normalizeUpcomingDividend(holding.upcomingDividend);
    const expectedAmount = dividend.perShare * Math.max(0, Number(holding.shares) || 0);
    return {
      portfolio, holding, ...dividend,
      expectedAmount, taxPercentage: rate,
      expectedAfterTax: expectedAmount * (1 - rate / 100),
    };
  })).filter((entry) => entry.holding.name?.trim() && entry.paymentDate >= today &&
    entry.perShare > 0 && Number.isFinite(entry.expectedAmount) && entry.expectedAmount > 0)
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
}
