import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  ScrollText,
  Settings,
  UtensilsCrossed,
  Grid,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Coffee,
  Sparkles,
  Boxes,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Switch } from '../ui/Switch';

export const Sidebar: React.FC = () => {
  const { userProfile, signOut, isSuperAdmin } = useAuth();
  const { sidebarCollapsed, toggleSidebar, liteMode, toggleLiteMode } = useUIStore();

  const superAdminLinks = [
    { to: '/super/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/super/cafes', label: 'Cafes', icon: <Building2 className="h-5 w-5" /> },
    { to: '/super/admins', label: 'Admins', icon: <Users className="h-5 w-5" /> },
    { to: '/super/audit', label: 'Audit Log', icon: <ScrollText className="h-5 w-5" /> },
    { to: '/super/settings', label: 'Platform Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const adminLinks = [
    { to: '/admin/orders', label: 'Live Orders', icon: <UtensilsCrossed className="h-5 w-5" /> },
    { to: '/admin/floor-map', label: 'Floor Map', icon: <Grid className="h-5 w-5" /> },
    { to: '/admin/menu', label: 'Menu & Pricing', icon: <Coffee className="h-5 w-5" /> },
    { to: '/admin/inventory', label: 'Inventory & Stock', icon: <Boxes className="h-5 w-5" /> },
    { to: '/admin/payments', label: 'Payments', icon: <CreditCard className="h-5 w-5" /> },
    { to: '/admin/reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" /> },
    { to: '/admin/settings', label: 'Cafe Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const links = isSuperAdmin ? superAdminLinks : adminLinks;

  return (
    <aside
      className={cn(
        'glass-surface border-r border-stone-200/80 dark:border-stone-800/80 h-screen sticky top-0 flex flex-col justify-between transition-all duration-200 z-30',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-stone-200/50 dark:border-stone-800/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm font-bold text-lg">
              DF
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-stone-900 dark:text-stone-100">
                  DineFlow
                </span>
                <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                  {isSuperAdmin ? 'Super Admin' : 'Cafe Admin'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group min-h-[44px]',
                  isActive
                    ? 'bg-accent text-white shadow-sm font-semibold'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/60'
                )
              }
              title={sidebarCollapsed ? link.label : undefined}
            >
              <span className="shrink-0">{link.icon}</span>
              {!sidebarCollapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer / User Controls */}
      <div className="p-3 border-t border-stone-200/50 dark:border-stone-800/50 space-y-3">
        {/* Lite Mode Toggle */}
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Lite Mode
            </span>
            <Switch checked={liteMode} onChange={toggleLiteMode} />
          </div>
        ) : null}

        {/* Theme Toggle */}
        <div className={cn('flex items-center', sidebarCollapsed ? 'justify-center' : 'justify-between px-1')}>
          {!sidebarCollapsed && (
            <span className="text-xs text-stone-500 font-medium">Theme</span>
          )}
          <ThemeToggle />
        </div>

        {/* User Card */}
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-xl bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/40',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <div className="h-8 w-8 rounded-full bg-accent/20 text-accent font-semibold flex items-center justify-center text-xs shrink-0">
            {userProfile?.name?.charAt(0) || 'U'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                {userProfile?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-stone-500 truncate">
                {userProfile?.email || 'admin@dineflow.app'}
              </p>
            </div>
          )}
          <button
            onClick={() => signOut()}
            title="Log out"
            className="p-1.5 text-stone-400 hover:text-red-500 transition-colors rounded-lg"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

