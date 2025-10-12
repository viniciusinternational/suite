'use client';

import { useEffect, useState } from 'react';
import { EmailPortal } from './portal';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import type { User } from '@/types';

interface EmailPortalWrapperProps {
  className?: string;
  user?: User;
}

// Simple email portal state management
const useEmailPortalStore = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openPortal = () => setIsOpen(true);
  const closePortal = () => setIsOpen(false);
  const togglePortal = () => setIsOpen(!isOpen);

  return { isOpen, openPortal, closePortal, togglePortal };
};

export const EmailPortalWrapper = ({
  className,
  user
}: EmailPortalWrapperProps) => {
  const { 
    isOpen, 
    closePortal, 
  } = useEmailPortalStore();

  // Handle escape key to close portal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closePortal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closePortal]);

  return (
    <EmailPortal
      isOpen={isOpen}
      className={className}
    >
      <div className="flex-1 h-full overflow-hidden bg-white rounded-lg shadow-sm border border-slate-200 m-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Email Center</h2>
          <p className="text-gray-600">Email functionality coming soon...</p>
        </div>
      </div>
    </EmailPortal>
  );
};

// Hook for managing email portal state
export const useEmailPortal = () => {
  const { 
    isOpen: isEmailPortalOpen, 
    openPortal: openEmailPortal, 
    closePortal: closeEmailPortal, 
    togglePortal: toggleEmailPortal 
  } = useEmailPortalStore();

  return {
    isEmailPortalOpen,
    openEmailPortal,
    closeEmailPortal,
    toggleEmailPortal
  };
};

// Email Portal Trigger Component
interface EmailPortalTriggerProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const EmailPortalTrigger = ({
  children,
  className,
  variant = 'default',
  size = 'default'
}: EmailPortalTriggerProps) => {
  const { openPortal } = useEmailPortalStore();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={openPortal}
      className={className}
    >
      <Mail className="h-4 w-4 mr-2" />
      {children || 'Open Email'}
    </Button>
  );
}; 