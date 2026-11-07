import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UserProfile } from '@/types/auth';
import { Cafe } from '@/types/cafe';
import { toast } from '@/components/ui/ToastStore';
import { UserCheck } from 'lucide-react';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafes: Cafe[];
  onSubmit: (adminData: Omit<UserProfile, 'uid' | 'createdAt'>) => Promise<void>;
}

export const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  isOpen,
  onClose,
  cafes,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cafeId, setCafeId] = useState(cafes[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    if (!cafeId) {
      toast.error('Please assign this admin to a cafe');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        role: 'admin',
        cafeId,
        active: true,
      });
      toast.success(`Admin account created for ${name}!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Cafe Admin"
      description="Create credentials and assign a manager to a specific cafe."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name *"
          placeholder="e.g. Ramesh Patel"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Email Address *"
          type="email"
          placeholder="manager@cafe.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
            Assigned Cafe *
          </label>
          <select
            value={cafeId}
            onChange={(e) => setCafeId(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300/80 bg-white/70 px-3.5 py-2 text-sm text-stone-900 transition-colors focus:border-accent focus:bg-white dark:border-stone-700/80 dark:bg-stone-900/60 dark:text-stone-100 dark:focus:border-accent"
          >
            {cafes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200/60 dark:border-stone-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} leftIcon={<UserCheck className="h-4 w-4" />}>
            Create Admin
          </Button>
        </div>
      </form>
    </Modal>
  );
};

