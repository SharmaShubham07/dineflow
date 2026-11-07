import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateAdminModal } from '@/components/super/CreateAdminModal';
import { getAdminUsers, getCafes, createAdminUser } from '@/lib/firestore';
import { UserProfile } from '@/types/auth';
import { Cafe } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';
import { Users, Plus, Building2, Mail } from 'lucide-react';

export const AdminsListPage: React.FC = () => {
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminsData, cafesData] = await Promise.all([
        getAdminUsers(),
        getCafes(),
      ]);
      setAdmins(adminsData);
      setCafes(cafesData);
    } catch (e) {
      toast.error('Failed to load admins data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAdmin = async (adminData: any) => {
    const created = await createAdminUser(adminData);
    setAdmins([created, ...admins]);
  };

  const getCafeName = (cafeId?: string) => {
    if (!cafeId) return 'Unassigned';
    const c = cafes.find((item) => item.id === cafeId);
    return c ? c.name : cafeId;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Cafe Admins & Managers
          </h2>
          <p className="text-sm text-stone-500">
            Accounts assigned to operate menus, live orders, and tables for each cafe.
          </p>
        </div>

        <Button
          onClick={() => {
            if (cafes.length === 0) {
              toast.error('Please create at least one cafe first before adding an admin.');
              return;
            }
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Admin Account
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-stone-500">Loading admin accounts...</div>
      ) : admins.length === 0 ? (
        <GlassCard className="p-8">
          <EmptyState
            icon={<Users className="h-8 w-8 text-accent" />}
            title="No Cafe Admins Created"
            description="Create manager accounts and link them to their respective cafes."
            actionLabel={cafes.length > 0 ? 'Create Admin' : 'Go to Cafes'}
            onAction={() => {
              if (cafes.length === 0) {
                window.location.href = '/super/cafes';
              } else {
                setIsModalOpen(true);
              }
            }}
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {admins.map((admin) => (
            <GlassCard key={admin.uid} variant="raised" className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0">
                    {admin.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {admin.name}
                    </h4>
                    <span className="text-[11px] font-mono text-stone-400">
                      UID: {admin.uid}
                    </span>
                  </div>
                </div>
                <Badge variant={admin.active ? 'success' : 'error'}>
                  {admin.active ? 'Active' : 'Suspended'}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-stone-400" />
                  <span>{admin.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-accent" />
                  <span className="font-semibold text-stone-900 dark:text-stone-200">
                    {getCafeName(admin.cafeId)}
                  </span>
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {cafes.length > 0 && (
        <CreateAdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          cafes={cafes}
          onSubmit={handleCreateAdmin}
        />
      )}
    </div>
  );
};

export default AdminsListPage;
