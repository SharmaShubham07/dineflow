import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-light dark:bg-surface-dark">
      <EmptyState
        title="404 - Page Not Found"
        description="The page or table session you are looking for does not exist."
        actionLabel="Go to Home"
        onAction={() => navigate('/login')}
      />
    </div>
  );
};

