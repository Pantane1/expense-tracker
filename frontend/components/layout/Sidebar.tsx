'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, TrendingUp, Wallet, BarChart2, FileText, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/reports', label: 'Reports', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    router.push('/login');
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-base font-semibold text-gray-900">
          Expense<span className="text-emerald-600">.</span>Track
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Personal Finance</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Main</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}

        <div className="pt-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Account</p>
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Settings size={16} />
            Settings
          </Link>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
