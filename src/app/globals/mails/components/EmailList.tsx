import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Star, 
  StarOff, 
  Paperclip, 
  Search, 
  RefreshCw,
  Mail,
  MailOpen,
  FileText,
  Archive,
  Trash,
  Send,
  Clock,
  ChevronDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Move,
  Tag
} from 'lucide-react';
import { useEmailsByFolder, useSearchEmails } from '../api/emailService';
import { useEmailPortalStore } from '../store';
import { useAuthStore } from '@/store';
import type { Email, EmailFolder } from '../types';

interface EmailListProps {
  selectedFolder: EmailFolder;
  onEmailSelect: (email: Email) => void;
  selectedEmailId?: string;
  onEmailSelectChange?: (emailIds: string[]) => void;
}

const EmailList: React.FC<EmailListProps> = ({ 
  selectedFolder, 
  onEmailSelect, 
  selectedEmailId,
  onEmailSelectChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // Get current email from store with fallback
  const portalEmail = useEmailPortalStore((s) => s.currentMail);
  const user = useAuthStore((s) => s.user);
  const currentEmail = portalEmail || user?.mailAddresses?.[0] || user?.email || '';

  // Use TanStack Query to fetch emails
  const { 
    data: emails = [], 
    isLoading, 
    error, 
    refetch 
    
  } = useEmailsByFolder(selectedFolder, currentEmail);

  // Use TanStack Query for search
  const { 
    data: searchResults = [], 
    isLoading: isSearchLoading 
  } = useSearchEmails(searchQuery, isSearching ? selectedFolder : undefined, currentEmail);

  const displayEmails = isSearching ? searchResults : emails;
  const isLoadingData = isLoading || (isSearching && isSearchLoading);

  // Pagination logic
  const totalItems = displayEmails.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmails = displayEmails.slice(startIndex, endIndex);

  // Reset to first page when search changes or folder changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFolder]);

  // Clear selections when folder changes
  useEffect(() => {
    setSelectedEmails(new Set());
  }, [selectedFolder]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onEmailSelectChange) {
      const emailIds = Array.from(selectedEmails);
      onEmailSelectChange(emailIds);
    }
  }, [selectedEmails, onEmailSelectChange]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(!!query);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleCheckboxChange = (emailId: string, checked: boolean, event: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation(); // Prevent row click
    const newSelectedEmails = new Set(selectedEmails);
    if (checked) {
      newSelectedEmails.add(emailId);
    } else {
      newSelectedEmails.delete(emailId);
    }
    setSelectedEmails(newSelectedEmails);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedEmails = new Set<string>();
    if (checked) {
      paginatedEmails.forEach(email => newSelectedEmails.add(email.id));
    }
    setSelectedEmails(newSelectedEmails);
  };

  const isAllSelected = paginatedEmails.length > 0 && paginatedEmails.every(email => selectedEmails.has(email.id));
  const isIndeterminate = paginatedEmails.some(email => selectedEmails.has(email.id)) && !isAllSelected;

  const handleBulkAction = (action: 'archive' | 'trash' | 'mark-read' | 'mark-unread' | 'star' | 'unstar') => {
    // Here you would implement the bulk actions
    console.log(`Bulk action: ${action}`, Array.from(selectedEmails));
    // Clear selections after action
    setSelectedEmails(new Set());
  };

  const formatDate = (date: Date) => {
    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getFolderIcon = (folder: EmailFolder) => {
    switch (folder) {
      case 'inbox':
        return <Mail className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'drafts':
        return <FileText className="h-4 w-4" />;
      case 'archive':
        return <Archive className="h-4 w-4" />;
      case 'trash':
        return <Trash className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <Card className="h-full border-0 shadow-none">
        <CardContent className="p-8">
          <div className="text-center text-destructive">
            <p className="text-sm">Error loading emails: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full bg-card">
      {/* Mobile top spacing for toggle button */}
      <div className="h-12 lg:hidden" />
      {/* Search Bar with Pagination */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="relative flex-1 order-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-8 sm:h-9 w-4" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-8 sm:h-9 border-border bg-muted rounded-lg focus:border-primary focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground text-sm"
            />
          </div>

          {/* Unread Count Badge - Mobile: Show above search */}
          {!isSearching && (
            <div className="flex items-center space-x-2 order-0 sm:order-2 justify-center sm:justify-start">
              {emails.filter(email => email.status === 'unread').length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 text-xs font-semibold"
                >
                  {emails.filter(email => email.status === 'unread').length} unread
                </Badge>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center gap-1 order-2 sm:order-3 justify-center sm:justify-end">
            {/* First Page */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous Page */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Info */}
            <div className="flex items-center gap-1 px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground">
              <span className="font-medium">{startIndex + 1}</span>
              <span className="text-muted-foreground hidden sm:inline">-</span>
              <span className="font-medium hidden sm:inline">{Math.min(endIndex, totalItems)}</span>
              <span className="text-muted-foreground hidden sm:inline">of</span>
              <span className="font-medium">{totalItems}</span>
            </div>

            {/* Next Page */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last Page */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedEmails.size > 0 && (
        <div className="px-2 sm:px-4 py-2 border-b border-border bg-primary/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary">
                {selectedEmails.size} selected
              </span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('mark-read')}
                className="h-7 px-2 text-xs"
              >
                <MailOpen className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Mark Read</span>
                <span className="sm:hidden">Read</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('mark-unread')}
                className="h-7 px-2 text-xs"
              >
                <Mail className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Mark Unread</span>
                <span className="sm:hidden">Unread</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('star')}
                className="h-7 px-2 text-xs"
              >
                <Star className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Star</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('archive')}
                className="h-7 px-2 text-xs"
              >
                <Archive className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Archive</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('trash')}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              >
                <Trash className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Email List */}
      <ScrollArea className="h-[calc(100vh-120px)]">
        {isLoadingData ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary mb-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
            </div>
            <p className="text-muted-foreground text-sm">Loading emails...</p>
          </div>
        ) : displayEmails.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                {getFolderIcon(selectedFolder)}
              </div>
              <p className="text-foreground font-medium mb-1 text-sm">
                {isSearching 
                  ? 'No emails found'
                  : `No emails in ${selectedFolder}`
                }
              </p>
              <p className="text-muted-foreground text-xs">
                {isSearching ? 'Try adjusting your search terms' : 'New emails will appear here'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Select All Header */}
            {paginatedEmails.length > 0 && (
              <div className="px-2 sm:px-4 py-2 bg-muted/30 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = isIndeterminate;
                        }
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
                    />
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Select All ({selectedEmails.size} selected)
                  </span>
                </div>
              </div>
            )}
            
            {paginatedEmails.map((email) => (
              <div
                key={email.id}
                className={`px-2 sm:px-4 py-2 sm:py-3 cursor-pointer transition-all duration-150 group ${
                  selectedEmailId === email.id 
                    ? 'bg-primary/10 border-l-2 border-l-primary' 
                    : email.status === 'unread' 
                      ? 'bg-blue-50/50 hover:bg-blue-50/70 border-l-2 border-l-blue-500' 
                      : 'hover:bg-muted/50'
                }`}
                onClick={() => onEmailSelect(email)}
              >
                <div className="flex items-center space-x-3">
                  {/* Compact Checkbox */}
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedEmails.has(email.id)}
                      onChange={(e) => handleCheckboxChange(email.id, e.target.checked, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
                    />
                  </div>

                  {/* Star Icon */}
                  <div className="flex-shrink-0">
                    {email.starred ? (
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    ) : (
                      <Star className="h-4 w-4 text-muted-foreground hover:text-amber-500" />
                    )}
                  </div>

                  {/* Priority Arrow */}
                  {email.priority === 'high' && (
                    <div className="flex-shrink-0">
                      <div className="w-0 h-0 border-l-4 border-l-amber-500 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                    </div>
                  )}

                  {/* Email Content */}
                  <div className="flex-1 min-w-0">
                    {/* Mobile Layout */}
                    <div className="block sm:hidden">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          {email.status === 'unread' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                          )}
                          <span className={`font-medium truncate text-sm ${
                            email.status === 'unread' ? 'text-foreground font-semibold' : 'text-muted-foreground'
                          }`}>
                            {email.from.name || email.from.email}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground flex-shrink-0">
                          {email.priority && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs px-1 py-0.5 rounded font-medium ${
                                email.priority === 'high' 
                                  ? 'border-red-200 text-red-700 bg-red-50' 
                                  : email.priority === 'low'
                                    ? 'border-blue-200 text-blue-700 bg-blue-50'
                                    : 'border-border text-muted-foreground bg-muted'
                              }`}
                            >
                              {email.priority}
                            </Badge>
                          )}
                          <span className="font-medium">{formatDate(email.date)}</span>
                        </div>
                      </div>
                      <div className="mb-1">
                        <span className={`font-medium truncate text-sm block ${
                          email.status === 'unread' ? 'text-foreground font-semibold' : 'text-foreground'
                        }`}>
                          {email.subject}
                        </span>
                      </div>
                      <div>
                        <span className={`text-sm truncate block ${
                          email.status === 'unread' ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {email.snippet || email.text || ''}
                        </span>
                      </div>
                    </div>
                    
                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="w-40 flex-shrink-0">
                            <div className="flex items-center space-x-2">
                              {email.status === 'unread' && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                              )}
                              <span className={`font-medium truncate text-sm block ${
                                email.status === 'unread' ? 'text-foreground font-semibold' : 'text-muted-foreground'
                              }`}>
                                {email.from.name || email.from.email}
                              </span>
                            </div>
                          </div>
                          <div className="w-8 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <span className={`font-medium truncate text-sm block ${
                              email.status === 'unread' ? 'text-foreground font-semibold' : 'text-foreground'
                            }`}>
                              {email.subject}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm truncate block ${
                              email.status === 'unread' ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              - {email.snippet || email.text || ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground flex-shrink-0 ml-4">
                          {email.priority && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                email.priority === 'high' 
                                  ? 'border-red-200 text-red-700 bg-red-50' 
                                  : email.priority === 'low'
                                    ? 'border-blue-200 text-blue-700 bg-blue-50'
                                    : 'border-border text-muted-foreground bg-muted'
                              }`}
                            >
                              {email.priority}
                            </Badge>
                          )}
                          <span className="font-medium">{formatDate(email.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1 sm:mt-2">
                      <div className="flex items-center space-x-2">
                        {email.attachments && email.attachments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-medium">{email.attachments.length}</span>
                          </div>
                        )}
                        {email.isDraft && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Draft</span>
                            <span className="sm:hidden">D</span>
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {email.labels && email.labels.slice(0, window.innerWidth < 640 ? 1 : 2).map((label) => (
                          <Badge key={label} variant="outline" className="text-xs px-1.5 py-0.5 border-border text-muted-foreground rounded">
                            {label}
                          </Badge>
                        ))}
                        {email.labels && email.labels.length > (window.innerWidth < 640 ? 1 : 2) && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-border text-muted-foreground rounded">
                            +{email.labels.length - (window.innerWidth < 640 ? 1 : 2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Icons (visible on hover) - Hidden on mobile */}
                  <div className="hidden sm:flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button className="p-1 hover:bg-muted rounded">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="p-1 hover:bg-muted rounded">
                      <Trash className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Compact Footer */}
      <div className="px-2 sm:px-4 py-2 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground text-xs sm:text-sm">
            {isSearching 
              ? `${searchResults.length} results`
              : `${emails.length} emails`
            }
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-6 px-2 text-xs hover:bg-muted rounded transition-all duration-150"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailList; 