import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Cafe } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';
import { Building2, Plus, Trash2 } from 'lucide-react';

interface CreateCafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    cafeData: Omit<Cafe, 'id' | 'createdAt'>,
    floorsConfig: { name: string; tableCount: number; prefix?: string }[]
  ) => Promise<void>;
}

export const CreateCafeModal: React.FC<CreateCafeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [taxPercent, setTaxPercent] = useState('5.0');
  const [currency, setCurrency] = useState('INR');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic floors setup
  const [floors, setFloors] = useState<
    { id: string; name: string; tableCount: number; prefix: string }[]
  >([
    { id: '1', name: 'Ground Floor', tableCount: 6, prefix: 'T-' },
  ]);

  const handleAddFloor = () => {
    const nextNum = floors.length + 1;
    setFloors([
      ...floors,
      {
        id: String(Date.now()),
        name: `Floor ${nextNum}`,
        tableCount: 4,
        prefix: `F${nextNum}-T`,
      },
    ]);
  };

  const handleRemoveFloor = (id: string) => {
    if (floors.length === 1) {
      toast.warning('A cafe must have at least one floor');
      return;
    }
    setFloors(floors.filter((f) => f.id !== id));
  };

  const handleFloorChange = (
    id: string,
    field: 'name' | 'tableCount' | 'prefix',
    value: string | number
  ) => {
    setFloors(
      floors.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Cafe name is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(
        {
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          gstNumber: gstNumber.trim() || undefined,
          taxPercent: parseFloat(taxPercent) || 5.0,
          currency,
          upiId: upiId.trim() || undefined,
          status: 'active',
        },
        floors.map((f) => ({
          name: f.name.trim() || 'Main Floor',
          tableCount: Math.max(1, Number(f.tableCount) || 1),
          prefix: f.prefix.trim() || 'T-',
        }))
      );
      toast.success(`Cafe "${name}" created with ${floors.length} floor(s)!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create cafe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Cafe (Tenant)"
      description="Add a new cafe tenant, configure floors, auto-generate tables and unique QR codes."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Building2 className="h-4 w-4" /> Cafe Details
          </h4>

          <Input
            label="Cafe / Restaurant Name *"
            placeholder="e.g. Blue Tokai Roasters"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="UPI ID (for Direct Pay)"
              placeholder="cafe@upi or business@okhdfc"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </div>

          <Input
            label="Physical Address"
            placeholder="Shop 4, High Street, Bandra West, Mumbai"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="GST Number"
              placeholder="27AAAAA0000A1Z5"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
            />
            <Input
              label="GST / Tax %"
              type="number"
              step="0.1"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
            />
            <Input
              label="Currency Code"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
        </div>

        {/* Floors & Tables Setup */}
        <div className="space-y-3 pt-4 border-t border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Floors & Table Allocation
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddFloor}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Floor
            </Button>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {floors.map((floor, idx) => (
              <div
                key={floor.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={floor.name}
                    onChange={(e) =>
                      handleFloorChange(floor.id, 'name', e.target.value)
                    }
                    placeholder={`Floor ${idx + 1}`}
                    className="w-full text-sm font-semibold bg-transparent border-b border-stone-300 dark:border-stone-600 focus:outline-none focus:border-accent py-1"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={floor.tableCount}
                    onChange={(e) =>
                      handleFloorChange(
                        floor.id,
                        'tableCount',
                        parseInt(e.target.value) || 1
                      )
                    }
                    title="Number of tables"
                    className="w-full text-center text-sm font-medium rounded-lg border border-stone-300 dark:border-stone-600 bg-white/80 dark:bg-stone-900 px-2 py-1"
                  />
                  <span className="block text-[10px] text-center text-stone-500">
                    tables
                  </span>
                </div>
                <div className="w-20">
                  <input
                    type="text"
                    value={floor.prefix}
                    onChange={(e) =>
                      handleFloorChange(floor.id, 'prefix', e.target.value)
                    }
                    title="Prefix for table numbering"
                    className="w-full text-center text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-600 bg-white/80 dark:bg-stone-900 px-2 py-1"
                  />
                  <span className="block text-[10px] text-center text-stone-500">
                    prefix
                  </span>
                </div>
                {floors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFloor(floor.id)}
                    className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200/60 dark:border-stone-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Cafe & Generate Tables
          </Button>
        </div>
      </form>
    </Modal>
  );
};

