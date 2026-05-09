export const formatCurrency = (amount: number, currency = 'KSh') => {
  return `${currency} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
};

export const currentMonth = () => new Date().toISOString().slice(0, 7);

export const getBudgetStatus = (spent: number, limit: number) => {
  const pct = (spent / limit) * 100;
  if (pct >= 100) return { label: 'Over budget', color: 'text-red-500', barColor: 'bg-red-500' };
  if (pct >= 80) return { label: 'Almost full', color: 'text-amber-500', barColor: 'bg-amber-400' };
  return { label: 'On track', color: 'text-emerald-600', barColor: 'bg-emerald-500' };
};

export const getMonthOptions = () => {
  const options = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = d.toISOString().slice(0, 7);
    options.push({ value: val, label: formatMonth(val) });
  }
  return options;
};
