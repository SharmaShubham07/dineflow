import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Floor } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';
import { Plus } from 'lucide-react';

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  floors: Floor[];
  onAddTable: (tableData: {
    floorId: string;
    floorName: string;
    label: string;
    capacity: number;
  }) => Promise<void>;
}

export const AddTableModal: React.FC<AddTableModalProps> = ({
  isOpen,
  onClose,
  floors,
  onAddTable,
}) => {
  const [selectedFloorId, setSelectedFloorId] = useState<string>(
    floors[0]?.id || ''
  );
  const [label, setLabel] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error('Table number/label is required (e.g. T-1, A4, VIP-1)');
      return;
    }

    const floor = floors.find((f) => f.id === selectedFloorId) || floors[0];
    if (!floor) {
      toast.error('Please select a floor');
      return;
    }

    setLoading(true);
    try {
      await onAddTable({
        floorId: floor.id,
        floorName: floor.name,
        label: label.trim(),
        capacity: parseInt(capacity) || 4,
      });
      toast.success(`Table "${label}" added with unique QR code!`);
      setLabel('');
      onClose();
    } catch (err: any) {
      toast.error('Failed to add table');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Dining Table"
      description="Create a table and auto-generate its dedicated QR code."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Floor Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
            Select Dining Floor *
          </label>
          <select
            value={selectedFloorId}
            onChange={(e) => setSelectedFloorId(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900 px-3 text-xs"
          >
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table Number & Capacity */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Table Label *"
            placeholder="e.g. T-5, VIP-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Seating Capacity"
            type="number"
            min="1"
            max="30"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} leftIcon={<Plus className="h-4 w-4" />}>
            Create Table & QR
          </Button>
        </div>
      </form>
    </Modal>
  );
};
