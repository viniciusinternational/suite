export interface EmailParticipant {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  disposition: 'attachment' | 'inline';
  contentId?: string;
  url?: string;
}

export interface EmailTracking {
  openCount: number;
  clickCount: number;
  lastOpened?: Date;
}

export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash' | 'spam';
export type EmailStatus = 'read' | 'unread' | 'archived' | 'deleted';
export type EmailPriority = 'low' | 'normal' | 'high';
export type ProcessingStatus = 'pending' | 'processed' | 'failed';
export type SyncStatus = 'synced' | 'syncing' | 'failed';
export type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'imap' | 'custom';

export interface DraftData {
  scheduledSendDate?: Date;
  lastEditedAt?: Date;
  autoSaveVersion?: number;
}

export interface Email {
  id: string;
  messageId: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string[];
  subject: string;
  from: EmailParticipant;
  to: EmailParticipant[];
  cc: EmailParticipant[];
  bcc: EmailParticipant[];
  replyTo?: EmailParticipant;
  attachments: EmailAttachment[];
  hasAttachments?: boolean;
  textBody?: string;
  htmlBody?: string;
  text?: string;
  html?: string;
  snippet?: string;
  date: Date;
  receivedDate?: Date;
  status: EmailStatus;
  starred: boolean;
  isImportant?: boolean;
  labels?: string[];
  priority?: EmailPriority;
  folder: EmailFolder;
  userId?: string;
  accountId?: string;
  isDraft?: boolean;
  draftData?: DraftData;
  headers?: Record<string, string>;
  tracking?: EmailTracking;
  spamScore?: number;
  isEncrypted?: boolean;
  signature?: string;
  rawData?: string;
  processingStatus?: ProcessingStatus;
  syncStatus?: SyncStatus;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ComposeEmailData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  content: string;
  htmlContent: string;
  attachments: EmailAttachment[];
  priority: EmailPriority;
  isDraft: boolean;
  scheduledSendDate?: Date;
  signature?: string;
}

export interface ComposeEmailDataWithFiles {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  content: string;
  htmlContent: string;
  attachments: File[];
  priority: EmailPriority;
  isDraft: boolean;
  scheduledSendDate?: Date;
  signature?: string;
}

export interface EmailFilters {
  folder?: EmailFolder;
  status?: EmailStatus;
  isStarred?: boolean;
  isImportant?: boolean;
  hasAttachments?: boolean;
  priority?: EmailPriority;
  from?: string;
  to?: string;
  subject?: string;
  labels?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface EmailSort {
  field: 'date' | 'subject' | 'from' | 'priority';
  direction: 'asc' | 'desc';
}

// Additional interfaces for completeness
export interface EmailAccount {
  id: string;
  userId: string;
  email: string;
  displayName?: string;
  provider: EmailProvider;
  isActive: boolean;
  isPrimary: boolean;
  syncSettings: {
    syncEnabled: boolean;
    syncFrequency: number;
    lastSyncAt?: Date;
    syncFromDate?: Date;
  };
  authData?: Record<string, any>;
  webhookConfig?: {
    url?: string;
    secret?: string;
    isActive: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: {
    timezone: string;
    dateFormat: string;
    emailsPerPage: number;
    autoMarkAsRead: boolean;
    defaultSignature?: string;
  };
  isActive: boolean;
  emailAccounts: string[];
  createdAt: Date;
  updatedAt: Date;
}