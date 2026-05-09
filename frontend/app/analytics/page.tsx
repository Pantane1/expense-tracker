'use client';
import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { transactionService } from '@/services';
import { Summary } from '@/lib/types';
import { formatCurrency, currentMonth, getMonthOptions } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const monthOptions = getMonthOptions();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await transactionService.getSummary(month);
      setSummary(data.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const trendData = (() => {
    if (!summary?.monthly) return [];
    const map: Record<string, { month: string; income: number; expense: number; savings: number }> = {};
    summary.monthly.forEach(({ month: m, type, total }) => {
      if (!map[m]) map[m] = { month: m.slice(5), income: 0, expense: 0, savings: 0 };
      map[m][type as 'income' | 'expense'] = Number(total);
    });
    Object.values(map).forEach((v) => { v.savings = Math.max(0, v.income - v.expense); });
    return Object.values(map).slice(-6);
  })();

  const incCats = summary?.byCategory.filter((c) => c.type === 'income').slice(0, 5) || [];
  const expCats = summary?.byCategory.filter((c) => c.type === 'expense').slice(0, 6) || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">Financial breakdown and trends</p>
          </div>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {monthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">6-month spending trend</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), user?.currency)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="income" stroke="#5DCAA5" strokeWidth={2} dot={false} name="Income" />
                  <Line type="monotone" dataKey="expense" stroke="#F0997B" strokeWidth={2} dot={false} name="Expenses" />
                  <Line type="monotone" dataKey="savings" stroke="#AFA9EC" strokeWidth={2} dot={false} name="Savings" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-medium text-gray-700 mb-4">Expense breakdown</h2>
                {expCats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={expCats} cx="50%" cy="50%" outerRadius={75} dataKey="total" nameKey="name" paddingAngle={2}>
                        {expCats.map((entry, i) => <Cell key={i} fill={entry.color || '#5DCAA5'} />)}
                      </Pie>
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), user?.currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 text-center py-16">No expense data</p>}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-medium text-gray-700 mb-4">Income sources</h2>
                {incCats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={incCats} layout="vertical" barSize={14}>
                      <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), user?.currency)} />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]} name="Amount">
                        {incCats.map((entry, i) => <Cell key={i} fill={entry.color || '#5DCAA5'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 text-center py-16">No income data</p>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
