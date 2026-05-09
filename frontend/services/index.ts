import api from '@/lib/api';
import { TransactionFilters } from '@/lib/types';

export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { name: string; currency: string }) =>
    api.put('/auth/profile', data),
};

export const transactionService = {
  getAll: (filters: TransactionFilters = {}) =>
    api.get('/transactions', { params: filters }),
  create: (data: object) => api.post('/transactions', data),
  update: (id: number, data: object) => api.put(`/transactions/${id}`, data),
  delete: (id: number) => api.delete(`/transactions/${id}`),
  getSummary: (month?: string) =>
    api.get('/transactions/summary', { params: { month } }),
};

export const budgetService = {
  getAll: (month?: string) => api.get('/budgets', { params: { month } }),
  create: (data: { category_id: number; amount: number; month: string }) =>
    api.post('/budgets', data),
  delete: (id: number) => api.delete(`/budgets/${id}`),
};

export const categoryService = {
  getAll: (type?: 'income' | 'expense') =>
    api.get('/categories', { params: { type } }),
  create: (data: { name: string; type: string; icon: string; color: string }) =>
    api.post('/categories', data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};
