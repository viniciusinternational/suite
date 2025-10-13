import { create } from "zustand";
import { persist } from "zustand/middleware";


interface EmailPortalState {
  isOpen: boolean;
  lastOpenedAt: Date | null;
  currentMail: string | null;
  // Actions
  openPortal: () => void;
  closePortal: () => void;
  togglePortal: () => void;
  setCurrentMail: (mail: string) => void;
}

export const useEmailPortalStore = create<EmailPortalState>()(
    persist(
      (set) => ({
        isOpen: false,
        lastOpenedAt: null,
        currentMail: null,
        openPortal: () => set({ 
          isOpen: true, 
          lastOpenedAt: new Date() 
        }),
        
        closePortal: () => set({ 
          isOpen: false,
        }),
        
        togglePortal: () => set(state => ({ 
          isOpen: !state.isOpen,
          lastOpenedAt: !state.isOpen ? new Date() : null
        })),
        setCurrentMail: (mail: string) => set({ currentMail: mail }),
      }),
      {
        name: 'email-portal-store',
        partialize: (state) => ({
          lastOpenedAt: state.lastOpenedAt,
          currentMail: state.currentMail,
        }),
      }
    )
  ); 