import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/ToastStore';
import { FolderPlus } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(name.trim());
      toast.success(`Category "${name}" created!`);
      setName('');
      onClose();
    } catch (e: any) {
      toast.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Menu Category"
      description="Organize your dishes and drinks into easily browsable sections."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Category Name *"
          placeholder="e.g. Sourdough & Toasts, Signature Mocktails"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200/60 dark:border-stone-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} leftIcon={<FolderPlus className="h-4 w-4" />}>
            Create Category
          </Button>
        </div>
      </form>
    </Modal>
  );
};

