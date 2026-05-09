'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { budgetService, categoryService } from '@/services';
import { Budget, Category } from '@/lib/types';
import { formatCurrency, currentMonth, getMonthOptions } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';

export default function BudgetsPage() {
  const { user } = useAuthStore();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category_id: '', amount: '' });
  const [saving, setSaving] = useState(false);
  const monthOptions = getMonthOptions();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await budgetService.getAll(month);
      setBudgets(data.data);
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { categoryService.getAll('expense').then(({ data }) => setCategories(data.data)); }, []);

  const handleSave = async () => {
    if (!form.category_id || !form.amount) { toast.error('Fill in all fields'); return; }
    setSaving(true);
    try {
      await budgetService.create({ category_id: parseInt(form.category_id), amount: parseFloat(form.amount), month });
      toast.success('Budget saved');
      setShowModal(false);
      setForm({ category_id: '', amount: '' });
      load();
    } catch { toast.error('Failed to save budget'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this budget?')) return;
    try { await budgetService.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Budgets</h1>
            <p className="text-sm text-gray-500 mt-0.5">Set spending limits per category</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {monthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg">
              <Plus size={16} /> Add budget
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : budgets.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
            <p className="text-gray-400 text-sm">No budgets set for this month.</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-emerald-600 hover:underline">Add your first budget</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {budgets.map((b) => {
              const pct = Math.min(100, Math.round((b.spent / b.amount) * 100));
              const over = b.spent > b.amount;
              const warn = pct >= 80;
              const barColor = over ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-emerald-500';
              return (
                <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: (b.color || '#6b7280') + '20' }}>
                        <span className="text-sm" style={{ color: b.color }}>◆</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{b.category_name}</p>
                        <p className={`text-xs ${over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-emerald-600'}`}>
                          {over ? 'Over budget!' : warn ? 'Almost full' : 'On track'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Spent: {formatCurrency(b.spent, user?.currency)}</span>
                    <span>Limit: {formatCurrency(b.amount, user?.currency)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 text-right">{pct}% used</p>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Set budget</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select expense category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Budget limit (KSh)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 10000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                  <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg">
                    {saving ? 'Saving...' : 'Save budget'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
