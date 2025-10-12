import React from 'react';
import { EmailPortalWrapper } from './email-portal';
import type { User } from '@/types';

export const EmailPortalProvider: React.FC<{ children: React.ReactNode, user?: User }> = ({
  children,
  user
}) => {
  return (
    <>
      {children}
      <EmailPortalWrapper user={user} />
    </>
  );
}; 