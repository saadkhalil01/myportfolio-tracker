export function isSavingsInvestment(category) {
  if (typeof category?.isSavings === 'boolean') return category.isSavings;
  return /savings?|emergency|cash|money\s*market|mutual\s*fund.*low\s*risk/i.test(
    String(category?.name || '')
  );
}
