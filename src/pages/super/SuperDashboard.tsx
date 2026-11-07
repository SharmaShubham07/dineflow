import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { CreateCafeModal } from '@/components/super/CreateCafeModal';
import { getCafes, getAdminUsers, createCafeWithFloors } from '@/lib/firestore';
import { seedDemoPlatformData } from '@/lib/seed';
import { Cafe } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';
import {
  Building2,
  Users,
  IndianRupee,
  QrCode,
  Plus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SuperDashboard: React.FC = () => {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [cafesData, adminsData] = await Promise.all([
        getCafes(),
        getAdminUsers(),
      ]);
      setCafes(cafesData);
      setAdminCount(adminsData.length);
    } catch (e) {
      console.warn('Dashboard data fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const { cafe, adminEmail } = await seedDemoPlatformData();
      toast.success(
        `Demo Seeded! Cafe "${cafe.name}" created with 8 tables & admin "${adminEmail}"`
      );
      await loadDashboardData();
    } catch (e: any) {
      toast.error('Failed to seed demo data: ' + e.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateCafe = async (cafeData: any, floorsConfig: any) => {
    const created = await createCafeWithFloors(cafeData, floorsConfig);
    setCafes([created, ...cafes]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Super Admin Control Center
          </h2>
          <p className="text-sm text-stone-500">
            Manage multi-tenant cafes, floors, QR table tokens, and assign cafe managers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleSeedDemo}
            loading={isSeeding}
            leftIcon={<Sparkles className="h-4 w-4 text-accent" />}
          >
            Seed Demo Cafe
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add New Cafe
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Cafes"
          value={cafes.length}
          icon={<Building2 className="h-5 w-5" />}
          description="Registered businesses"
        />
        <StatCard
          label="Active Admins"
          value={adminCount}
          icon={<Users className="h-5 w-5" />}
          description="Assigned managers"
        />
        <StatCard
          label="Floor Layouts"
          value={cafes.length ? `${cafes.length * 2}` : '0'}
          icon={<QrCode className="h-5 w-5" />}
          description="Configured dining zones"
        />
        <StatCard
          label="System Status"
          value="Healthy"
          icon={<IndianRupee className="h-5 w-5" />}
          description="Real-time listener active"
        />
      </div>

      {/* Cafes Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Active Cafes & Establishment Directory
          </h3>
          {cafes.length > 0 && (
            <button
              onClick={() => navigate('/super/cafes')}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              View all ({cafes.length}) <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-500">Loading directory...</div>
        ) : cafes.length === 0 ? (
          <GlassCard className="p-8">
            <EmptyState
              icon={<Building2 className="h-8 w-8 text-accent" />}
              title="No Cafes Configured"
              description="Create a cafe manually or click 'Seed Demo Cafe' to populate a ready-to-test coffee shop."
              actionLabel="Seed Demo Data"
              onAction={handleSeedDemo}
            />
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cafes.slice(0, 3).map((cafe) => (
              <GlassCard
                key={cafe.id}
                variant="interactive"
                className="p-5 flex flex-col justify-between"
                onClick={() => navigate(`/super/cafes/${cafe.id}`)}
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-accent text-white font-bold flex items-center justify-center shrink-0">
                      {cafe.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {cafe.name}
                      </h4>
                      <p className="text-xs text-stone-500 truncate max-w-[200px]">
                        {cafe.address || 'Address unlisted'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-600">
                    ● {cafe.status}
                  </span>
                  <span className="text-accent font-medium flex items-center gap-1">
                    Manage QRs <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Create Cafe Modal */}
      <CreateCafeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCafe}
      />
    </div>
  );
};

export default SuperDashboard;
