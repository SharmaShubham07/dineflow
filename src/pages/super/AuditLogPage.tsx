import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { ScrollText, Clock } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const sampleLogs = [
    {
      id: 'log_1',
      action: 'Cafe Created',
      actor: 'Super Admin',
      target: 'Artisan Roasters & Cafe (cafe_7x9q)',
      time: 'Just now',
    },
    {
      id: 'log_2',
      action: 'QR Codes Generated',
      actor: 'System Auto-Engine',
      target: '8 Table QR Tokens for Artisan Roasters',
      time: 'Just now',
    },
    {
      id: 'log_3',
      action: 'Admin Account Created',
      actor: 'Super Admin',
      target: 'admin@artisanroasters.com (Rohan Sharma)',
      time: 'Just now',
    },
    {
      id: 'log_4',
      action: 'System Initialized',
      actor: 'DineFlow Engine',
      target: 'Multi-Tenant Security Rules & DB Structure',
      time: '1 hour ago',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Security & Operations Audit Log
        </h2>
        <p className="text-sm text-stone-500">
          Immutable ledger of sensitive platform operations, token rotations, and configuration changes.
        </p>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="divide-y divide-stone-200/60 dark:divide-stone-800">
          {sampleLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent shrink-0 mt-0.5">
                  <ScrollText className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {log.action}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {log.actor}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">{log.target}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-400 self-end sm:self-auto">
                <Clock className="h-3.5 w-3.5" />
                <span>{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default AuditLogPage;
