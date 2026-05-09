'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { transactionService, categoryService } from '@/services';
import { Transaction, Category, Pagination } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';

const EMPTY = { title: '', amount: '', type: 'expense' as 'income' | 'expense', category_id: '', description: '', date: new Date().toISOString().slice(0, 10), is_recurring: false };

export default function TransactionsPage() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ search: '', type: '', page: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await transactionService.getAll({
        search: filters.search || undefined,
        type: (filters.type as 'income' | 'expense') || undefined,
        page: filters.page,
      });
      setTransactions(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    categoryService.getAll().then(({ data }) => setCategories(data.data));
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setForm({ title: tx.title, amount: String(tx.amount), type: tx.type, category_id: String(tx.category_id || ''), description: tx.description || '', date: tx.date.slice(0, 10), is_recurring: tx.is_recurring });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.amount || !form.date) { toast.error('Fill in required fields'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), category_id: form.category_id ? parseInt(form.category_id) : null };
      if (editing) { await transactionService.update(editing.id, payload); toast.success('Updated'); }
      else { await transactionService.create(payload); toast.success('Transaction added'); }
      setShowModal(false); load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    try { await transactionService.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const filteredCats = categories.filter((c) => !form.type || c.type === form.type);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Transactions</h1>
            <p className="text-sm text-gray-500 mt-0.5">{pagination?.total ?? 0} total records</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Add transaction
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl mb-4">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-1 border border-gray-200 rounded-lg px-3 py-2">
              <Search size={15} className="text-gray-400" />
              <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} placeholder="Search transactions..." className="flex-1 text-sm outline-none" />
            </div>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">No transactions found</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: (tx.color || '#6b7280') + '20' }}>
                    <span className="text-xs font-semibold" style={{ color: tx.color || '#6b7280' }}>{tx.type === 'income' ? '↑' : '↓'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{tx.title}</p>
                    <p className="text-xs text-gray-400">{tx.category_name || 'Uncategorized'} · {formatDate(tx.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold mr-4 ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount, user?.currency)}
                  </span>
                  <button onClick={() => openEdit(tx)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(tx.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
              <button disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
              <span className="text-sm text-gray-500">Page {filters.page} of {pagination.pages}</span>
              <button disabled={filters.page === pagination.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">{editing ? 'Edit transaction' : 'New transaction'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(['income', 'expense'] as const).map((t) => (
                    <button key={t} onClick={() => setForm({ ...form, type: t, category_id: '' })}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${form.type === t ? (t === 'income' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-500 text-white border-red-500') : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Naivas Supermarket" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount (KSh) *</label>
                    <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select category</option>
                    {filteredCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional note..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                    {saving ? 'Saving...' : editing ? 'Save changes' : 'Add transaction'}
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
