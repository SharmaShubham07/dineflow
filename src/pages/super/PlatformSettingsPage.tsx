import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { toast } from '@/components/ui/ToastStore';
import { Settings, Save, Smartphone } from 'lucide-react';

export const PlatformSettingsPage: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [pwaCaching, setPwaCaching] = React.useState(true);
  const [defaultCurrency, setDefaultCurrency] = React.useState('INR');
  const [defaultTax, setDefaultTax] = React.useState('5.0');

  const handleSave = () => {
    toast.success('Platform configuration saved successfully');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Global Platform Settings
        </h2>
        <p className="text-sm text-stone-500">
          Super Admin controls for system policies, offline PWA caching, and tenant defaults.
        </p>
      </div>

      <GlassCard variant="raised" className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
            <Settings className="h-4 w-4" /> Tenant Defaults
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Default Currency Code"
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
            />
            <Input
              label="Default GST / Tax Rate (%)"
              value={defaultTax}
              onChange={(e) => setDefaultTax(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
            <Smartphone className="h-4 w-4" /> PWA & System Flags
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-100/60 dark:bg-stone-800/40 border border-stone-200/50 dark:border-stone-700/50">
              <div>
                <span className="font-semibold text-sm text-stone-900 dark:text-stone-100 block">
                  Service Worker Menu Caching
                </span>
                <span className="text-xs text-stone-500">
                  Caches customer menus on first load for rapid offline/weak-network response.
                </span>
              </div>
              <Switch checked={pwaCaching} onChange={setPwaCaching} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-100/60 dark:bg-stone-800/40 border border-stone-200/50 dark:border-stone-700/50">
              <div>
                <span className="font-semibold text-sm text-stone-900 dark:text-stone-100 block">
                  Global Maintenance Mode
                </span>
                <span className="text-xs text-stone-500">
                  Temporarily disable new customer order submissions platform-wide.
                </span>
              </div>
              <Switch checked={maintenanceMode} onChange={setMaintenanceMode} />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800 flex justify-end">
          <Button onClick={handleSave} leftIcon={<Save className="h-4 w-4" />}>
            Save Configuration
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default PlatformSettingsPage;
