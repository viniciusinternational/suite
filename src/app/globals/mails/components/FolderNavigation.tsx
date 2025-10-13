import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Inbox, 
  Send, 
  FileText, 
  Archive, 
  Trash,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '../api/emailService';
import type { EmailFolder } from '../types';

interface FolderNavigationProps {
  selectedFolder: EmailFolder;
  onFolderSelect: (folder: EmailFolder) => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

// Custom hook for individual folder unread count
const useUnreadCount = (folder: EmailFolder) => {
  return useQuery({
    queryKey: ['unread-count', folder],
    queryFn: () => getUnreadCount(folder),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

const FolderNavigation: React.FC<FolderNavigationProps> = ({
  selectedFolder,
  onFolderSelect,
  onCollapseChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const folders: { key: EmailFolder; label: string; icon: React.ReactNode }[] = [
    { key: 'inbox', label: 'Inbox', icon: <Inbox className="h-4 w-4" /> },
    { key: 'sent', label: 'Sent', icon: <Send className="h-4 w-4" /> },
    { key: 'drafts', label: 'Drafts', icon: <FileText className="h-4 w-4" /> },
    { key: 'archive', label: 'Archive', icon: <Archive className="h-4 w-4" /> },
    { key: 'trash', label: 'Trash', icon: <Trash className="h-4 w-4" /> },
  ];

  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-full sm:w-64 lg:w-72'} h-full bg-card border-r border-border transition-all duration-300 ease-in-out shadow-lg lg:shadow-none ${isCollapsed ? 'p-2' : 'p-3 sm:p-4 lg:p-6'}`}>
      {/* Collapse/Expand Button - Desktop Only */}
      <div className="hidden lg:flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCollapseToggle}
          className="h-8 w-8 p-0 hover:bg-muted/70 rounded-lg transition-all duration-200"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Folder List with Labels Always Visible */}
      <div className={`${isCollapsed ? 'space-y-1' : 'space-y-1 sm:space-y-2'}`}>
        {!isCollapsed && (
          <h3 className="text-xs sm:text-sm font-bold text-foreground mb-3 sm:mb-4">
            Folders
          </h3>
        )}
        {folders.map((folder) => {
          const { data: unreadCount = 0 } = useUnreadCount(folder.key);
          const isSelected = selectedFolder === folder.key;
          
          return (
            <Button
              key={folder.key}
              variant="ghost"
              className={`w-full ${isCollapsed ? 'justify-center p-0 h-10' : 'justify-start px-2 sm:px-4 h-10 sm:h-11'} rounded-lg sm:rounded-xl transition-all duration-200 group ${
                isSelected 
                  ? 'bg-primary/10 text-primary shadow-sm border border-primary/20' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onFolderSelect(folder.key)}
              title={isCollapsed ? folder.label : undefined}
            >
              {isCollapsed ? (
                <div className="flex flex-col items-center space-y-1 relative">
                  <div className="relative">
                    <span className={`transition-colors duration-200 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}>
                      {folder.icon}
                    </span>
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-200 ${
                    isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {folder.label}
                  </span>
                </div>
              ) : (
                <div className="flex items-center w-full">
                  <span className={`mr-2 sm:mr-4 transition-colors duration-200 ${
                    isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {folder.icon}
                  </span>
                  <span className="flex-1 text-left font-medium text-xs sm:text-sm">{folder.label}</span>
                  {unreadCount > 0 && (
                    <Badge 
                      variant="secondary" 
                      className={`ml-auto text-xs font-semibold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${
                        isSelected 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default FolderNavigation; 