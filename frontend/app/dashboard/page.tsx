'use client';
import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { transactionService } from '@/services';
import { Summary, Transaction } from '@/lib/types';
import { formatCurrency, formatDate, currentMonth, getMonthOptions } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const monthOptions = getMonthOptions();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, txRes] = await Promise.all([
        transactionService.getSummary(month),
        transactionService.getAll({ page: 1, limit: 5 }),
      ]);
      setSummary(sumRes.data.data);
      setRecent(txRes.data.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const barData = (() => {
    if (!summary?.monthly) return [];
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    summary.monthly.forEach(({ month: m, type, total }) => {
      if (!map[m]) map[m] = { month: m.slice(5), income: 0, expense: 0 };
      map[m][type as 'income' | 'expense'] = Number(total);
    });
    return Object.values(map).slice(-6);
  })();

  const pieData = summary?.byCategory
    .filter((c) => c.type === 'expense')
    .slice(0, 6)
    .map((c) => ({ name: c.name, value: Number(c.total), color: c.color })) || [];

  const stats = [
    { label: 'Total Balance', value: (summary?.balance ?? 0), icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Monthly Income', value: (summary?.totalIncome ?? 0), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Expenses', value: (summary?.totalExpenses ?? 0), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Savings', value: Math.max(0, (summary?.totalIncome ?? 0) - (summary?.totalExpenses ?? 0)), icon: PiggyBank, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon size={16} className={color} />
                  </div>
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(value, user?.currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Income vs Expenses</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barGap={4}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), user?.currency)} />
                  <Bar dataKey="income" fill="#5DCAA5" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#F0997B" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Spending by category</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color || '#5DCAA5'} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), user?.currency)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-gray-400">No expense data</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-700">Recent transactions</h2>
              <a href="/transactions" className="text-xs text-emerald-600 hover:underline">View all</a>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recent.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: tx.color ? tx.color + '20' : '#f3f4f6' }}>
                      <span style={{ color: tx.color || '#6b7280' }}>$</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{tx.title}</p>
                      <p className="text-xs text-gray-400">{tx.category_name || 'Uncategorized'} · {formatDate(tx.date)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount, user?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
