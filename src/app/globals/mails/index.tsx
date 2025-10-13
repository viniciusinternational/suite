import React, { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import FolderNavigation from './components/FolderNavigation';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import ComposeModal from './components/ComposeModal';
import { sendEmail, saveDraft, validateEmailData } from './api/emailService';
import type { Email, EmailFolder, ComposeEmailData, ComposeEmailDataWithFiles } from './types';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Menu, X, Plus, Mail } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmailPortalStore } from '@/pages/globals/mails/store';

const EmailPage: React.FC<{ closePortal: () => void }> = ({ closePortal }) => {
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  // Selected email ids are handled downstream; no state needed here
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isFolderNavOpen, setIsFolderNavOpen] = useState(false);
  const [isFolderNavCollapsed, setIsFolderNavCollapsed] = useState(false);
  const [composeData, setComposeData] = useState<ComposeEmailData>({
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    content: '',
    htmlContent: '',
    attachments: [],
    priority: 'normal',
    isDraft: false
  });
  const { user } = useAuthStore();
  const { currentMail, setCurrentMail } = useEmailPortalStore();

  // Determine available email addresses for the dropdown
  const availableEmails = (user?.mailAddresses && user.mailAddresses.length > 0)
    ? user.mailAddresses
    : (user?.email ? [user.email] : []);

  // Ensure a default selected email is set once user data is available
  useEffect(() => {
    if (!currentMail && availableEmails.length > 0) {
      setCurrentMail(availableEmails[0]);
    }
  }, [currentMail, availableEmails, setCurrentMail]);

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
  };

  const handleEmailSelectChange = useCallback(() => {
    // No-op: kept to satisfy child component API
  }, []);

  const handleBackToList = () => {
    setSelectedEmail(null);
  };

  const handleFolderSelect = (folder: EmailFolder) => {
    setSelectedFolder(folder);
    setSelectedEmail(null);
    setIsFolderNavOpen(false); // Close mobile folder nav after selection
  };

  const handleComposeClick = () => {
    setIsComposeOpen(true);
    setIsFolderNavOpen(false); // Close mobile folder nav when compose is opened
  };

  const handleComposeSubmit = async (data: ComposeEmailDataWithFiles) => {
    // Validate email data
    const validation = validateEmailData({
      to: data.to,
      subject: data.subject,
      content: data.content
    });

    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Send email via API with the actual File objects
    await sendEmail({
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      content: data.content,
      htmlContent: data.htmlContent,
      attachments: data.attachments // Now we have actual File objects
    });

    // Invalidate and refetch emails to show the sent email
    await queryClient.invalidateQueries({ queryKey: ['emails', 'sent'] });

    // Show success message (you can implement a toast notification here)
    console.log('Email sent successfully');
  };

  const handleSaveDraft = async (data: ComposeEmailDataWithFiles) => {
    // Save draft via API with the actual File objects
    await saveDraft({
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      content: data.content,
      htmlContent: data.htmlContent,
      attachments: data.attachments // Now we have actual File objects
    });

    // Invalidate and refetch drafts to show the saved draft
    await queryClient.invalidateQueries({ queryKey: ['emails', 'drafts'] });

    // Show success message (you can implement a toast notification here)
    console.log('Draft saved successfully');
  };

  const resetComposeData = () => {
    setComposeData({
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      content: '',
      htmlContent: '',
      attachments: [],
      priority: 'normal',
      isDraft: false
    });
  };

  const handleComposeClose = () => {
    setIsComposeOpen(false);
    resetComposeData();
  };

  const handleReply = (data: ComposeEmailData) => {
    setComposeData(data);
    setIsComposeOpen(true);
  };

  const handleForward = (data: ComposeEmailData) => {
    setComposeData(data);
    setIsComposeOpen(true);
  };

  const handleFolderNavCollapse = (collapsed: boolean) => {
    setIsFolderNavCollapsed(collapsed);
  };

  return (
    <div className="flex h-full bg-background relative flex-col">
      {/* Dense Header */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm gap-2">
        {/* Left side - Logo, Mobile menu and title */}
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            {/* <img 
              src="https://www.viniciusint.com/logo.png" 
              alt="Vinicius Logo" 
              className="h-6 w-auto"
            /> */}
            <div className="h-4 w-px bg-border"></div>
          </div>

          {/* Mobile Folder Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFolderNavOpen(!isFolderNavOpen)}
            className="lg:hidden h-8 w-8 p-0"
          >
            {isFolderNavOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
          
          {/* Title, current folder and email */}
          <div className="flex items-center space-x-2 min-w-0">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Mail</span>
            <span className="text-muted-foreground text-sm">•</span>
            <span className="text-sm font-medium text-foreground capitalize">
              {selectedFolder}
            </span>
            {currentMail && (
              <div className="hidden md:flex items-center space-x-2 min-w-0">
                <span className="text-muted-foreground text-sm">•</span>
                <span className="text-xs md:text-sm text-muted-foreground truncate max-w-[200px] lg:max-w-[280px]">
                  {currentMail}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center - User info (hidden on mobile, collapse earlier to free space) */}
        <div className="hidden lg:flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">
                {user?.fullName || 'User'}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.email || 'user@example.com'}
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Account selector, Compose button and close button */}
        <div className="flex items-center space-x-2">
          {/* Email Account Dropdown (hide on mobile to save space) */}
          <div className="min-w-[220px] hidden md:block">
            <Select value={currentMail || undefined} onValueChange={setCurrentMail}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select email" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[10050]">
                {availableEmails.map((addr: string) => (
                  <SelectItem key={addr} value={addr}>
                    {addr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleComposeClick}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 rounded-lg h-8 w-8 p-0 sm:w-auto sm:px-3"
          >
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline text-sm font-medium">Compose</span>
          </Button>
          
          {/* Close Portal Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={closePortal}
            className="h-8 w-8 p-0 hover:bg-muted/70 rounded-lg transition-all duration-200 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Folder Navigation Overlay */}
        <div className="lg:hidden">
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${
              isFolderNavOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsFolderNavOpen(false)}
          />
          
          {/* Sliding Panel */}
          <div className={`fixed left-0 top-0 bottom-0 w-64 z-40 transform transition-transform duration-300 ease-in-out ${
            isFolderNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <FolderNavigation
              selectedFolder={selectedFolder}
              onFolderSelect={handleFolderSelect}
              onCollapseChange={handleFolderNavCollapse}
            />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className={`hidden lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
          isFolderNavCollapsed ? 'w-16' : 'w-72'
        }`}>
          {/* Desktop Folder Navigation */}
          <FolderNavigation
            selectedFolder={selectedFolder}
            onFolderSelect={handleFolderSelect}
            onCollapseChange={handleFolderNavCollapse}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden bg-card lg:border-l border-border">
          {selectedEmail ? (
            <div className="w-full">
              <EmailDetail
                emailId={selectedEmail.id}
                onBack={handleBackToList}
                onReply={handleReply}
                onForward={handleForward}
              />
            </div>
          ) : (
            <div className="w-full">
              <EmailList
                selectedFolder={selectedFolder}
                onEmailSelect={handleEmailSelect}
                selectedEmailId={undefined}
                onEmailSelectChange={handleEmailSelectChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={handleComposeClose}
        onSubmit={handleComposeSubmit}
        onSaveDraft={handleSaveDraft}
        initialData={composeData}
        mode={composeData.subject.startsWith('Re:') ? 'reply' : composeData.subject.startsWith('Fwd:') ? 'forward' : 'compose'}
      />
    </div>
  );
};

export default EmailPage;
