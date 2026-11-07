import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Bell } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

export const AdminLayout: React.FC = () => {
  const { userProfile, isSuperAdmin } = useAuth();

  return (
    <div className="min-h-screen flex bg-surface-light dark:bg-surface-dark transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="glass-surface h-16 px-6 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-base font-bold text-stone-900 dark:text-stone-100">
              {isSuperAdmin ? 'Platform Management' : userProfile?.cafeId ? 'Cafe POS & Live Operations' : 'Cafe Dashboard'}
            </h1>
            <p className="text-xs text-stone-500">
              Welcome back, {userProfile?.name || 'Manager'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IconButton
              size="sm"
              variant="outline"
              aria-label="Notifications"
              className="relative text-stone-600 dark:text-stone-300"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-white dark:ring-stone-900" />
            </IconButton>
          </div>
        </header>

        {/* Main Content View */}
        <main className="p-6 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

