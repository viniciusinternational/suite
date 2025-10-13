import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Reply, 
  Forward, 
  Trash2, 
  Archive, 
  Star, 
  StarOff,
  Paperclip,
  Download,
  ArrowLeft,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  Flag,
  Mail,
  MailOpen,
  Info
} from 'lucide-react';
import { useEmailById, markEmailAsRead, markEmailAsUnread } from '../api/emailService';
import { useEmailPortalStore } from '../store';
import { useAuthStore } from '@/store';
import type { Email, EmailPriority, ComposeEmailData } from '../types';

interface EmailDetailProps {
  emailId?: string;
  onBack: () => void;
  onReply: (data: ComposeEmailData) => void;
  onForward: (data: ComposeEmailData) => void;
}

const EmailDetail: React.FC<EmailDetailProps> = ({
  emailId,
  onBack,
  onReply,
  onForward
}) => {
  // Get current email from store with fallback
  const portalEmail = useEmailPortalStore((s) => s.currentMail);
  const user = useAuthStore((s) => s.user);
  const currentEmail = portalEmail || user?.mailAddresses?.[0] || user?.email || '';
  
  const { data: email, isLoading, error } = useEmailById(emailId || '', currentEmail);
  const [showDetails, setShowDetails] = useState(false);

  // Mark email as read when opened
  useEffect(() => {
    if (email && email.status === 'unread') {
      markEmailAsRead(email.id).catch(console.error);
    }
  }, [email]);

  if (!emailId) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/40">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted/60 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-muted-foreground/60" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Email Selected</h3>
            <p className="text-muted-foreground">Choose an email from the list to view its details</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/40">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">Loading Email</h3>
            <p className="text-muted-foreground">Please wait while we fetch your email...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-destructive/5 to-destructive/10">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-destructive/60" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Email</h3>
            <p className="text-muted-foreground">{error?.message || 'Email not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadAttachment = (attachment: any) => {
    try {
      // Convert base64 content to blob
      const byteCharacters = atob(attachment.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.mimeType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Downloading attachment:', attachment.filename);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      // You could add a toast notification here for better UX
    }
  };

  const handleReply = (email: Email) => {
    // For reply, we want to:
    // 1. Set the "To" field to the original sender
    // 2. Add "Re:" prefix to subject if not already present
    // 3. Include the original email content as quoted text
    const replyTo = [email.from.email];
    const replySubject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
    
    // Get the email body content (prefer HTML, fallback to text)
    const originalContent = email.htmlBody || email.textBody || email.text || '';
    
    // Format the reply content with the original email quoted
    const replyContent = `
      <br><br>
      <div style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 10px; color: #666;">
        <div style="margin-bottom: 10px;">
          <strong>From:</strong> ${email.from.name || email.from.email}<br>
          <strong>Sent:</strong> ${formatDate(email.date)}<br>
          <strong>To:</strong> ${email.to.map(r => r.name || r.email).join(', ')}<br>
          <strong>Subject:</strong> ${email.subject}
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 10px;">
          ${originalContent}
        </div>
      </div>
    `;

    // Create a compose data object for the reply
    const replyData = {
      to: replyTo,
      cc: [],
      bcc: [],
      subject: replySubject,
      content: replyContent,
      htmlContent: replyContent,
      attachments: [],
      priority: 'normal' as EmailPriority,
      isDraft: false
    };

    onReply(replyData);
  };

  const handleForward = (email: Email) => {
    // For forward, we want to:
    // 1. Keep "To" field empty for user to fill
    // 2. Add "Fwd:" prefix to subject if not already present
    // 3. Include the original email content as quoted text
    const forwardSubject = email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`;
    
    // Get the email body content (prefer HTML, fallback to text)
    const originalContent = email.htmlBody || email.textBody || email.text || '';
    
    // Format the forward content with the original email quoted
    const forwardContent = `
      <br><br>
      <div style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 10px; color: #666;">
        <div style="margin-bottom: 10px;">
          <strong>From:</strong> ${email.from.name || email.from.email}<br>
          <strong>Sent:</strong> ${formatDate(email.date)}<br>
          <strong>To:</strong> ${email.to.map(r => r.name || r.email).join(', ')}<br>
          <strong>Subject:</strong> ${email.subject}
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 10px;">
          ${originalContent}
        </div>
      </div>
    `;

    // Create a compose data object for the forward
    const forwardData = {
      to: [],
      cc: [],
      bcc: [],
      subject: forwardSubject,
      content: forwardContent,
      htmlContent: forwardContent,
      attachments: [],
      priority: 'normal' as EmailPriority,
      isDraft: false
    };

    onForward(forwardData);
  };

  return (
    <div className="h-full w-full bg-background flex flex-col relative">
      {/* Mobile top spacing for toggle button */}
      <div className="h-12 lg:hidden" />
      {/* Enhanced Header Toolbar with Glass Effect */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/60 px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between z-10 flex-shrink-0 shadow-sm gap-3 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            size="sm"
            className="hover:bg-muted/70 rounded-lg px-2 sm:px-3 py-2 transition-all duration-200 hover:shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <span className="ml-1 sm:hidden text-sm">Back</span>
          </Button>
          <div className="h-6 w-px bg-border/60 hidden sm:block"></div>
          <div className="flex items-center space-x-1 flex-wrap">
            {/* Unread Indicator */}
            {email?.status === 'unread' && (
              <div className="flex items-center space-x-2 px-2 sm:px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-blue-700">Unread</span>
              </div>
            )}
            <Button variant="ghost" size="sm" className="hover:bg-muted/70 rounded-lg p-2 sm:p-2.5 transition-all duration-200">
              <Archive className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-muted/70 rounded-lg p-2 sm:p-2.5 transition-all duration-200 hidden sm:inline-flex">
              <Flag className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-muted/70 rounded-lg p-2 sm:p-2.5 transition-all duration-200">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-muted/70 rounded-lg p-2 sm:p-2.5 transition-all duration-200"
              onClick={async () => {
                if (email?.status === 'unread') {
                  await markEmailAsRead(email.id);
                } else {
                  await markEmailAsUnread(email.id);
                }
              }}
            >
              {email?.status === 'unread' ? (
                <MailOpen className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Mail className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-muted/70 rounded-lg p-2 sm:p-2.5 transition-all duration-200">
              {email?.starred ? (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end sm:justify-start">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => handleReply(email)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 sm:px-4 py-2 text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Reply className="h-3.5 w-3.5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Reply</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleForward(email)} 
            className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg border-border/60 hover:bg-muted/70 hover:border-border transition-all duration-200"
          >
            <Forward className="h-3.5 w-3.5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Forward</span>
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-muted/70 rounded-lg p-2 sm:p-2.5 transition-all duration-200">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Enhanced Scrollable Content Area */}
      <div className="flex-1 pb-20 overflow-y-auto overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Enhanced Email Subject & Labels */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-3 sm:mb-4 break-words leading-tight">{email.subject}</h1>
            
            {/* Enhanced Labels */}
            {email.labels && email.labels.length > 0 && (
              <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-1 sm:gap-2">
                {email.labels.map((label) => (
                  <Badge 
                    key={label} 
                    variant="outline" 
                    className="text-xs bg-primary/8 text-primary border-primary/20 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 font-medium hover:bg-primary/12 transition-colors duration-200"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Email Details Toggle */}
          <div className="mb-4 sm:mb-6">
            <Button
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 transition-all duration-200 hover:shadow-sm"
            >
              <Info className="h-4 w-4" />
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="font-medium">Email Details</span>
            </Button>
          </div>

          {/* Enhanced Email Details (Collapsible) */}
          {showDetails && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl sm:rounded-2xl border border-border/60 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 text-sm">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <span className="font-semibold text-foreground block mb-2 text-xs uppercase tracking-wide text-muted-foreground">From:</span>
                    <div className="text-foreground break-all font-medium bg-background/50 rounded-lg px-3 py-2 text-sm">
                      {email.from.name} &lt;{email.from.email}&gt;
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block mb-2 text-xs uppercase tracking-wide text-muted-foreground">To:</span>
                    <div className="space-y-1">
                      {email.to?.map((recipient, index) => (
                        <div key={index} className="text-foreground break-all bg-background/50 rounded-lg px-3 py-2 text-sm">
                          {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
                        </div>
                      ))}
                    </div>
                  </div>
                  {email.cc && email.cc.length > 0 && (
                    <div>
                      <span className="font-semibold text-foreground block mb-2 text-xs uppercase tracking-wide text-muted-foreground">CC:</span>
                      <div className="space-y-1">
                        {email.cc.map((recipient, index) => (
                          <div key={index} className="text-foreground break-all bg-background/50 rounded-lg px-3 py-2 text-sm">
                            {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {email.bcc && email.bcc.length > 0 && (
                    <div>
                      <span className="font-semibold text-foreground block mb-2 text-xs uppercase tracking-wide text-muted-foreground">BCC:</span>
                      <div className="space-y-1">
                        {email.bcc.map((recipient, index) => (
                          <div key={index} className="text-foreground break-all bg-background/50 rounded-lg px-3 py-2 text-sm">
                            {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-foreground block mb-2 text-xs uppercase tracking-wide text-muted-foreground">Date:</span>
                    <div className="text-foreground bg-background/50 rounded-lg px-3 py-2 font-medium text-sm">{formatDate(email.date)}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block mb-2 text-xs uppercase tracking-wide text-muted-foreground">Message ID:</span>
                    <div className="text-muted-foreground font-mono text-xs break-all bg-background/50 rounded-lg px-3 py-2">{email.id}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Email Header Card */}
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-card to-muted/20 rounded-xl sm:rounded-2xl border border-border/60 shadow-sm">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 ring-2 ring-primary/10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                  {getInitials(email.from.email, email.from.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 flex-wrap">
                      <span className="font-semibold text-foreground break-words text-base sm:text-lg">
                        {email.from.name || email.from.email}
                      </span>
                      {email.priority && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold flex-shrink-0 ${
                            email.priority === 'high' 
                              ? 'border-red-200 text-red-700 bg-red-50 shadow-sm' 
                              : email.priority === 'low'
                                ? 'border-blue-200 text-blue-700 bg-blue-50 shadow-sm'
                                : 'border-border text-muted-foreground bg-muted shadow-sm'
                          }`}
                        >
                          {email.priority.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-sm text-muted-foreground">
                      <span className="break-all font-medium">{email.from.email}</span>
                      <span className="hidden sm:inline text-border">•</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span className="break-words">{formatDate(email.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {email.to && email.to.length > 1 && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-1">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">{email.to.length} recipients</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Email Body */}
          <div className="mb-6 sm:mb-8">
            <div className="prose prose-sm max-w-none">
                {email.htmlBody ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: email.htmlBody }} 
                    className="[&>*]:max-w-full [&_img]:max-w-full [&_img]:h-auto [&_table]:max-w-full [&_table]:overflow-x-auto text-sm sm:text-base"
                  />
                ) : (
                  <div className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
                    {email.textBody || email.text}
                  </div>
                )}
            </div>
          </div>

          {/* Enhanced Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-lg">
                  <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-base sm:text-lg">
                  Attachments ({email.attachments.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {email.attachments.map((attachment, index) => (
                  <div onClick={() => downloadAttachment(attachment)} key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-card to-muted/20 rounded-lg sm:rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors duration-200">
                        <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs sm:text-sm text-foreground break-words mb-1">{attachment.filename}</div>
                        <div className="text-xs text-muted-foreground font-medium">{formatFileSize(attachment.size)}</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => downloadAttachment(attachment)}
                      variant="ghost" 
                      size="sm" 
                      className="hover:bg-primary/10 hover:text-primary flex-shrink-0 ml-2 sm:ml-3 rounded-lg p-2 sm:p-2.5 transition-all duration-200"
                    >
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;