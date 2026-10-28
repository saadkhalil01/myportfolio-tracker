export function paymentDate(start, offset) {
  const date = new Date(start.getFullYear(), start.getMonth() + offset, 1);
  date.setDate(Math.min(start.getDate(), new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  return date;
}

export function payoffPlan(total, monthly, start) {
  if (!(total > 0) || !(monthly > 0) || !Number.isFinite(total) || !Number.isFinite(monthly)) return null;
  const count = Math.ceil(total / monthly);
  if (count > 1200) return null;
  return { count, end: paymentDate(start, count - 1), final: total - monthly * (count - 1) };
}
