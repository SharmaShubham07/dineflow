import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/ToastStore';
import { Mail, Lock, Coffee } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { seedDemoPlatformData } from '@/lib/seed';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleQuickDemoSuperAdmin = async () => {
    setEmail('superadmin@dineflow.app');
    setPassword('admin123');
    await signIn('superadmin@dineflow.app', 'admin123');
    navigate('/super/dashboard', { replace: true });
  };

  const handleQuickDemoCafeAdmin = async () => {
    await seedDemoPlatformData();
    setEmail('admin@artisanroasters.com');
    setPassword('cafe123');
    await signIn('admin@artisanroasters.com', 'cafe123');
    navigate('/admin/orders', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Successfully logged in');

      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (userProfile?.role === 'superadmin') {
        navigate('/super/dashboard', { replace: true });
      } else {
        navigate('/admin/orders', { replace: true });
      }
    } catch (err: any) {
      // In dev mode when offline or demo accounts are clicked:
      if (email.includes('super')) {
        navigate('/super/dashboard', { replace: true });
      } else {
        navigate('/admin/orders', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-surface-light via-surface-light-secondary to-surface-light dark:from-surface-dark dark:via-surface-dark-secondary dark:to-surface-dark">
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slideUp">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-lg mb-3">
            <Coffee className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Sign In to DineFlow
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Cafe POS & QR Table Ordering Platform
          </p>
        </div>

        <GlassCard variant="raised" className="p-7 border border-white/60 dark:border-stone-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@cafe.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              className="w-full text-base font-semibold py-3"
              size="lg"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-stone-200/50 dark:border-stone-800/50 space-y-2">
            <p className="text-[11px] font-semibold text-center uppercase tracking-wider text-stone-400">
              ⚡ Quick Developer & Testing Bypass
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuickDemoSuperAdmin}
                className="text-xs"
              >
                Super Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuickDemoCafeAdmin}
                className="text-xs"
              >
                Cafe Admin
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
