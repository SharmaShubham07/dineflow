import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateCafeModal } from '@/components/super/CreateCafeModal';
import { getCafes, createCafeWithFloors, deleteCafe } from '@/lib/firestore';
import { Cafe } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  QrCode,
  ArrowRight,
  Trash2,
} from 'lucide-react';

export const CafesListPage: React.FC = () => {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const loadCafes = async () => {
    setLoading(true);
    try {
      const data = await getCafes();
      setCafes(data);
    } catch (e) {
      toast.error('Failed to load cafes list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCafes();
  }, []);

  const handleCreateCafe = async (cafeData: any, floorsConfig: any) => {
    const created = await createCafeWithFloors(cafeData, floorsConfig);
    setCafes([created, ...cafes]);
  };

  const handleDeleteCafe = async (cafe: Cafe) => {
    if (
      !confirm(
        `Are you sure you want to delete ${cafe.name}? This will remove all associated floors, tables, and QR codes.`
      )
    ) {
      return;
    }
    await deleteCafe(cafe.id);
    setCafes(cafes.filter((c) => c.id !== cafe.id));
    toast.success(`Cafe "${cafe.name}" removed.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Registered Cafes & Restaurants
          </h2>
          <p className="text-sm text-stone-500">
            Multi-tenant directory of all establishments on DineFlow.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add New Cafe
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-stone-500">Loading cafes...</div>
      ) : cafes.length === 0 ? (
        <GlassCard className="p-8">
          <EmptyState
            icon={<Building2 className="h-8 w-8 text-accent" />}
            title="No Cafes Configured"
            description="Create your first cafe to configure floors, tables, and generate QR codes."
            actionLabel="Add Cafe"
            onAction={() => setIsModalOpen(true)}
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cafes.map((cafe) => (
            <GlassCard
              key={cafe.id}
              variant="interactive"
              className="p-5 flex flex-col justify-between"
              onClick={() => navigate(`/super/cafes/${cafe.id}`)}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-accent text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
                      {cafe.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-1">
                        {cafe.name}
                      </h3>
                      <p className="text-xs text-stone-500 font-mono">ID: {cafe.id}</p>
                    </div>
                  </div>
                  <Badge variant={cafe.status === 'active' ? 'success' : 'error'}>
                    {cafe.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 py-3 border-t border-stone-200/50 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400">
                  <p className="flex items-center gap-2 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                    <span>{cafe.address || 'Address unlisted'}</span>
                  </p>
                  {cafe.phone && (
                    <p className="flex items-center gap-2 truncate">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                      <span>{cafe.phone}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <QrCode className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span>GST: {cafe.taxPercent}% · Currency: {cafe.currency}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCafe(cafe);
                  }}
                  className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg transition-colors"
                  title="Delete Cafe"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
                  <span>Manage Cafe & QRs</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Modal for cafe creation */}
      <CreateCafeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCafe}
      />
    </div>
  );
};

export default CafesListPage;
