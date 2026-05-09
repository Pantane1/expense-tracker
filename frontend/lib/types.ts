export interface User {
  id: number;
  name: string;
  email: string;
  currency: string;
  avatar?: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_default: boolean;
}

export interface Transaction {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: number;
  category_name?: string;
  icon?: string;
  color?: string;
  description?: string;
  date: string;
  receipt_url?: string;
  is_recurring: boolean;
  recurring_interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  created_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  category_name: string;
  icon: string;
  color: string;
  amount: number;
  month: string;
  spent: number;
}

export interface Summary {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: { name: string; color: string; icon: string; type: string; total: number }[];
  monthly: { month: string; type: string; total: number }[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination;
}

export interface TransactionFilters {
  type?: "income" | "expense";
  category_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}
