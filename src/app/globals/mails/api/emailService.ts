import { useQuery } from '@tanstack/react-query';
import type { Email, EmailFolder } from '../types';
import { ApiController } from '@/axios';
import { useAuthStore } from '@/store';
import { useEmailPortalStore } from '@/pages/globals/mails/store';
import { BASE_URL_MAIL } from '@/config';

// Always resolve the latest selected email from the store (fallback to user's primary email)
const getCurrentEmail = (): string => {
  const selected = useEmailPortalStore.getState().currentMail;
  const authState = useAuthStore.getState();
  const fallback = authState.user?.mailAddresses?.[0] || authState.user?.email || '';
  console.log('selected', selected);
  console.log('fallback', fallback);
  return selected || fallback;
};

const apiController = new ApiController(BASE_URL_MAIL, {
  // 'email': getCurrentEmail()
});

// Helper function to convert API response dates to Date objects
const parseEmailDates = (email: any): Email => {
  const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Transform API response to match Email interface
  return {
    ...email,
    // Use createdAt as the main date field since API doesn't have a separate 'date' field
    date: parseDate(email.createdAt),
    receivedDate: parseDate(email.createdAt),
    createdAt: parseDate(email.createdAt),
    updatedAt: parseDate(email.updatedAt),
    // Transform from/to/cc/bcc structure to match Email interface
    from: {
      email: email.from?.address || email.from?.email || '',
      name: email.from?.name || ''
    },
    to: email.to?.map((recipient: any) => ({
      email: recipient.address || recipient.email || '',
      name: recipient.name || ''
    })) || [],
    cc: email.cc?.map((recipient: any) => ({
      email: recipient.address || recipient.email || '',
      name: recipient.name || ''
    })) || [],
    bcc: email.bcc?.map((recipient: any) => ({
      email: recipient.address || recipient.email || '',
      name: recipient.name || ''
    })) || [],
    // Transform reply_to to replyTo
    replyTo: email.reply_to ? {
      email: email.reply_to,
      name: ''
    } : undefined,
    // Map text/html fields from API response
    text: email.text || email.textBody || '',
    html: email.html || email.htmlBody || '',
    textBody: email.text || email.textBody || '',
    htmlBody: email.html || email.htmlBody || '',
    // Ensure snippet is available
    snippet: email.snippet || (email.text ? email.text.substring(0, 100) + '...' : ''),
    // Map other fields
    hasAttachments: email.attachments && email.attachments.length > 0,
    ...(email.deletedAt && { deletedAt: parseDate(email.deletedAt) }),
    ...(email.draftData?.lastEditedAt && { 
      draftData: { 
        ...email.draftData, 
        lastEditedAt: parseDate(email.draftData.lastEditedAt) 
      } 
    })
  };
};

// API functions
const fetchEmailsByFolder = async (folder: EmailFolder): Promise<Email[]> => {
  try {
    const response = await apiController.get<{
      data?: Email[];
      pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    }>(`/mail/folder/${folder}?email=${encodeURIComponent(getCurrentEmail())}`);
    
    // Debug: Log the first email's date values
    const list = Array.isArray(response?.data) ? response.data : [];
    if (list.length > 0) {
      const firstEmail = list[0];
      console.log('First email raw data:', firstEmail);
      console.log('First email date values:', {
        date: firstEmail.date,
        receivedDate: firstEmail.receivedDate,
        createdAt: firstEmail.createdAt,
        updatedAt: firstEmail.updatedAt
      });
    }
    
    const transformedEmails = list.map(parseEmailDates);
    
    // Debug: Log the first transformed email
    if (transformedEmails.length > 0) {
      console.log('First email transformed data:', transformedEmails[0]);
    }
    
    return transformedEmails;
  } catch (error) {
    console.error(`Failed to fetch emails for folder ${folder}:`, error);
    throw error;
  }
};

const fetchEmailById = async (id: string): Promise<Email | null> => {
  try {
    const response = await apiController.get<Email>(`/mail/${id}?email=${encodeURIComponent(getCurrentEmail())}`);
    
    // Debug: Log the email's raw data
    console.log('Email raw data:', response);
    console.log('Email date values:', {
      date: response.date,
      receivedDate: response.receivedDate,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    });
    
    const transformedEmail = parseEmailDates(response);
    console.log('Email transformed data:', transformedEmail);
    
    return transformedEmail;
  } catch (error) {
    console.error(`Failed to fetch email ${id}:`, error);
    throw error;
  }
};

const searchEmails = async (query: string, folder?: EmailFolder): Promise<Email[]> => {
  try {
    const params: any = { q: query };
    if (folder) {
      params.folder = folder;
    }
    
    const response = await apiController.get<{
      data?: Email[];
      pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    }>('/mail/search?email=' + encodeURIComponent(getCurrentEmail()), params);
    const list = Array.isArray(response?.data) ? response.data : [];
    return list.map(parseEmailDates);
  } catch (error) {
    console.error('Failed to search emails:', error);
    throw error;
  }
};

// React Query hooks
export const useEmailsByFolder = (folder: EmailFolder, currentEmail?: string) => {
  const email = currentEmail || '';
  return useQuery({
    queryKey: ['emails', folder, email],
    queryFn: () => fetchEmailsByFolder(folder),
    enabled: !!email && !!folder,
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 10 * 1000, // 10 seconds
  });
};

export const useEmailById = (id: string, currentEmail?: string) => {
  const email = currentEmail || '';
  return useQuery({
    queryKey: ['email', id, email],
    queryFn: () => fetchEmailById(id),
    enabled: !!id && !!email,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSearchEmails = (query: string, folder?: EmailFolder, currentEmail?: string) => {
  const email = currentEmail || '';
  return useQuery({
    queryKey: ['search', query, folder, email],
    queryFn: () => searchEmails(query, folder),
    enabled: !!query && !!email,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Utility functions
export const getUnreadCount = async (folder: EmailFolder): Promise<number> => {
  try {
    const response = await apiController.get<{ count: number }>(`/mail/unread-count/${folder}?email=${encodeURIComponent(getCurrentEmail())}`);
    return response.count;
  } catch (error) {
    console.error(`Failed to get unread count for folder ${folder}:`, error);
    return 0;
  }
};

export const formatEmailSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Additional API functions for email operations
export const markEmailAsRead = async (emailId: string): Promise<void> => {
  try {
    await apiController.put(`/mail/${emailId}/read?email=${encodeURIComponent(getCurrentEmail())}`);
  } catch (error) {
    console.error(`Failed to mark email ${emailId} as read:`, error);
    throw error;
  }
};

export const markEmailAsUnread = async (emailId: string): Promise<void> => {
  try {
    await apiController.put(`/mail/${emailId}/unread?email=${encodeURIComponent(getCurrentEmail())}`);
  } catch (error) {
    console.error(`Failed to mark email ${emailId} as unread:`, error);
    throw error;
  }
};

export const starEmail = async (emailId: string): Promise<void> => {
  try {
    await apiController.put(`/mail/${emailId}/star?email=${encodeURIComponent(getCurrentEmail())}`);
  } catch (error) {
    console.error(`Failed to star email ${emailId}:`, error);
    throw error;
  }
};

export const unstarEmail = async (emailId: string): Promise<void> => {
  try {
    await apiController.put(`/mail/${emailId}/unstar?email=${encodeURIComponent(getCurrentEmail())}`);
  } catch (error) {
    console.error(`Failed to unstar email ${emailId}:`, error);
    throw error;
  }
};

export const moveEmailToFolder = async (emailId: string, folder: EmailFolder): Promise<void> => {
  try {
    await apiController.put(`/mail/${emailId}/move?email=${encodeURIComponent(getCurrentEmail())}`, { folder });
  } catch (error) {
    console.error(`Failed to move email ${emailId} to folder ${folder}:`, error);
    throw error;
  }
};

export const deleteEmail = async (emailId: string): Promise<void> => {
  try {
    await apiController.delete(`/mail/${emailId}?email=${encodeURIComponent(getCurrentEmail())}`);
  } catch (error) {
    console.error(`Failed to delete email ${emailId}:`, error);
    throw error;
  }
};

export const sendEmail = async (emailData: {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  htmlContent?: string;
  attachments?: File[];
}): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append('to', JSON.stringify(emailData.to));
    if (emailData.cc) formData.append('cc', JSON.stringify(emailData.cc));
    if (emailData.bcc) formData.append('bcc', JSON.stringify(emailData.bcc));
    formData.append('subject', emailData.subject);
    formData.append('content', emailData.content);
    if (emailData.htmlContent) formData.append('htmlContent', emailData.htmlContent);
    console.log('emailData', emailData);
    
    if (emailData.attachments) {
      emailData.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    await apiController.post('/mail/send?email=' + encodeURIComponent(getCurrentEmail())  , formData);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

export const saveDraft = async (draftData: {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  content?: string;
  htmlContent?: string;
  attachments?: File[];
}): Promise<Email> => {
  try {
    const formData = new FormData();
    if (draftData.to) formData.append('to', JSON.stringify(draftData.to));
    if (draftData.cc) formData.append('cc', JSON.stringify(draftData.cc));
    if (draftData.bcc) formData.append('bcc', JSON.stringify(draftData.bcc));
    if (draftData.subject) formData.append('subject', draftData.subject);
    if (draftData.content) formData.append('content', draftData.content);
    if (draftData.htmlContent) formData.append('htmlContent', draftData.htmlContent);
    
    if (draftData.attachments) {
      draftData.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await apiController.post<Email>('/mail/draft', formData);
    return parseEmailDates(response);
  } catch (error) {
    console.error('Failed to save draft:', error);
    throw error;
  }
};

// Additional utility functions for email management
export const bulkMarkAsRead = async (emailIds: string[]): Promise<void> => {
  try {
    await apiController.put('/mail/bulk/read', { emailIds });
  } catch (error) {
    console.error('Failed to bulk mark emails as read:', error);
    throw error;
  }
};

export const bulkMarkAsUnread = async (emailIds: string[]): Promise<void> => {
  try {
    await apiController.put('/mail/bulk/unread', { emailIds });
  } catch (error) {
    console.error('Failed to bulk mark emails as unread:', error);
    throw error;
  }
};

export const bulkMoveToFolder = async (emailIds: string[], folder: EmailFolder): Promise<void> => {
  try {
    await apiController.put('/mail/bulk/move', { emailIds, folder });
  } catch (error) {
    console.error('Failed to bulk move emails:', error);
    throw error;
  }
};

export const bulkDelete = async (emailIds: string[]): Promise<void> => {
  try {
    await apiController.put('/mail/bulk/delete', { emailIds });
  } catch (error) {
    console.error('Failed to bulk delete emails:', error);
    throw error;
  }
};

export const getEmailStats = async (): Promise<{
  total: number;
  unread: number;
  starred: number;
  withAttachments: number;
}> => {
  try {
    const response = await apiController.get<{
      total: number;
      unread: number;
      starred: number;
      withAttachments: number;
    }>('/mail/stats');
    return response;
  } catch (error) {
    console.error('Failed to get email stats:', error);
    throw error;
  }
};

export const syncEmails = async (): Promise<void> => {
  try {
    await apiController.post('/mail/sync');
  } catch (error) {
    console.error('Failed to sync emails:', error);
    throw error;
  }
};

// Email validation utilities
export const validateEmailAddress = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateEmailData = (emailData: {
  to: string[];
  subject: string;
  content: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!emailData.to || emailData.to.length === 0) {
    errors.push('At least one recipient is required');
  } else {
    emailData.to.forEach((email, index) => {
      if (!validateEmailAddress(email)) {
        errors.push(`Invalid email address at position ${index + 1}: ${email}`);
      }
    });
  }

  if (!emailData.subject || emailData.subject.trim() === '') {
    errors.push('Subject is required');
  }

  if (!emailData.content || emailData.content.trim() === '') {
    errors.push('Email content is required');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}; 