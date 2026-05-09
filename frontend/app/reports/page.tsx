'use client';
import { useEffect, useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import { transactionService } from '@/services';
import { Summary, Transaction } from '@/lib/types';
import { formatCurrency, formatDate, currentMonth, getMonthOptions, formatMonth } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const monthOptions = getMonthOptions();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, txRes] = await Promise.all([
        transactionService.getSummary(month),
        transactionService.getAll({ page: 1, limit: 100, start_date: `${month}-01`, end_date: `${month}-31` }),
      ]);
      setSummary(sumRes.data.data);
      setTransactions(txRes.data.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Title', 'Type', 'Category', 'Amount (KSh)', 'Description'],
      ...transactions.map((t) => [
        formatDate(t.date), t.title, t.type, t.category_name || '', t.amount, t.description || '',
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const savingsRate = summary && summary.totalIncome > 0
    ? Math.round(((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100)
    : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">Monthly financial summary</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {monthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">Summary — {formatMonth(month)}</h2>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Income', value: summary?.totalIncome ?? 0, color: 'text-emerald-600' },
                  { label: 'Total Expenses', value: summary?.totalExpenses ?? 0, color: 'text-red-500' },
                  { label: 'Net Balance', value: summary?.balance ?? 0, color: (summary?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500' },
                  { label: 'Savings Rate', value: null, savingsRate, color: savingsRate >= 20 ? 'text-emerald-600' : 'text-amber-500' },
                ].map(({ label, value, color, savingsRate: sr }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className={`text-lg font-semibold ${color}`}>
                      {value !== null ? formatCurrency(value, user?.currency) : `${sr}%`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">All transactions — {formatMonth(month)}</h2>
              {transactions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No transactions this month</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-medium text-gray-400 pb-2">Date</th>
                        <th className="text-left text-xs font-medium text-gray-400 pb-2">Title</th>
                        <th className="text-left text-xs font-medium text-gray-400 pb-2">Category</th>
                        <th className="text-left text-xs font-medium text-gray-400 pb-2">Type</th>
                        <th className="text-right text-xs font-medium text-gray-400 pb-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-2.5 text-gray-400 text-xs">{formatDate(tx.date)}</td>
                          <td className="py-2.5 text-gray-900 font-medium">{tx.title}</td>
                          <td className="py-2.5 text-gray-500">{tx.category_name || '—'}</td>
                          <td className="py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className={`py-2.5 text-right font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount, user?.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td colSpan={4} className="pt-3 text-sm font-medium text-gray-700">Net total</td>
                        <td className={`pt-3 text-right font-semibold ${(summary?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatCurrency(summary?.balance ?? 0, user?.currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
