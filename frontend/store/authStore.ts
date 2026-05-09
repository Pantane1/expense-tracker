import { create } from 'zustand';
import { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('et_token', token);
    localStorage.setItem('et_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('et_token');
    localStorage.removeItem('et_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('et_token');
    const raw = localStorage.getItem('et_user');
    if (token && raw) {
      try {
        const user = JSON.parse(raw) as User;
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('et_token');
        localStorage.removeItem('et_user');
      }
    }
  },
}));
