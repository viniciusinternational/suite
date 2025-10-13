import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, X, Plus } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import type { ComposeEmailData, ComposeEmailDataWithFiles, EmailPriority } from '../types';

// Custom styles for Quill editor
const quillStyles = `
  .ql-editor {
    min-height: 250px;
    font-size: 14px;
    line-height: 1.5;
  }
  .ql-toolbar {
    border-top: 1px solid var(--border);
    border-left: none;
    border-right: none;
    border-bottom: 1px solid var(--border);
    background-color: var(--muted);
  }
  .ql-container {
    border: none;
  }
  .ql-editor.ql-blank::before {
    color: var(--muted-foreground);
    font-style: italic;
  }
`;

interface FileWithPreview extends File {}

interface EmailInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  className?: string;
}

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// EmailInput component for handling multiple emails
const EmailInput: React.FC<EmailInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "email@example.com",
  className = "" 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last email on backspace if input is empty
      const newEmails = value.slice(0, -1);
      onChange(newEmails);
    }
  };

  const addEmail = () => {
    const email = inputValue.trim();
    if (!email) return;

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (value.includes(email)) {
      setError('This email is already added');
      return;
    }

    onChange([...value, email]);
    setInputValue('');
    setError('');
  };

  const removeEmail = (index: number) => {
    const newEmails = value.filter((_, i) => i !== index);
    onChange(newEmails);
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addEmail();
    }
  };

  return (
    <div className={`flex-1 ${className}`}>
      <div className="flex flex-wrap gap-1 min-h-[32px] p-1 border border-border rounded-md bg-background">
        {value.map((email, index) => (
          <div key={index} className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs">
            <span>{email}</span>
            <button
              onClick={() => removeEmail(index)}
              className="text-primary hover:text-primary/70 ml-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] border-0 outline-none bg-transparent text-sm placeholder:text-muted-foreground"
        />
      </div>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ComposeEmailDataWithFiles) => Promise<void>;
  onSaveDraft?: (data: ComposeEmailDataWithFiles) => Promise<void>;
  initialData?: Partial<ComposeEmailData>;
  mode?: 'compose' | 'reply' | 'forward';
}

const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSaveDraft,
  initialData = {},
  mode = 'compose'
}) => {
  const [composeData, setComposeData] = useState<ComposeEmailData>({
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    content: '',
    htmlContent: '',
    attachments: [],
    priority: 'normal',
    isDraft: false,
    ...initialData
  });

  const [toEmails, setToEmails] = useState<string[]>(initialData.to || []);
  const [ccEmails, setCcEmails] = useState<string[]>(initialData.cc || []);
  const [bccEmails, setBccEmails] = useState<string[]>(initialData.bcc || []);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update compose data when email arrays change
  useEffect(() => {
    setComposeData(prev => ({
      ...prev,
      to: toEmails,
      cc: ccEmails,
      bcc: bccEmails,
      attachments: selectedFiles
    }));
  }, [toEmails, ccEmails, bccEmails, selectedFiles]);

  // Update compose data when initialData changes (for reply/forward modes)
  useEffect(() => {
    console.log('initialData', initialData);
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('initialData', initialData);
      setComposeData(prev => ({
        ...prev,
        ...initialData
      }));
      
      // Update email arrays if provided
      if (initialData.to) {
        setToEmails(initialData.to);
      }
      if (initialData.cc?.length) {
        setCcEmails(initialData.cc);
        setShowCc(true);
      }
      if (initialData.bcc?.length) {
        setBccEmails(initialData.bcc);
        setShowBcc(true);
      }
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!toEmails.length) {
      setError('Please add at least one recipient');
      return;
    }

    if (!composeData.subject.trim()) {
      setError('Please add a subject');
      return;
    }

    if (!composeData.content.trim()) {
      setError('Please add a message');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      console.log('selectedFiles', selectedFiles);
      await onSubmit({
        ...composeData,
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        attachments: selectedFiles
      });
      
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;

    setIsSavingDraft(true);
    setError(null);

    try {
      await onSaveDraft({
        ...composeData,
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        attachments: selectedFiles
      });
      
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleSubmit();
        } else if (event.key === 's') {
          event.preventDefault();
          handleSaveDraft();
        }
      } else if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, composeData, toEmails, ccEmails, bccEmails, selectedFiles]);

  const handleClose = () => {
    setError(null);
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
    setToEmails(initialData.to || []);
    setCcEmails(initialData.cc || []);
    setBccEmails(initialData.bcc || []);
    setSelectedFiles([]);
    onClose();
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
      isDraft: false,
      ...initialData
    });
    setToEmails(initialData.to || []);
    setCcEmails(initialData.cc || []);
    setBccEmails(initialData.bcc || []);
    setSelectedFiles([]);
    setError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    // Reset the input so the same file can be selected again if needed
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{quillStyles}</style>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-card rounded-lg shadow-2xl max-w-2xl w-full h-[calc(100vh-1rem)] sm:h-[600px] flex flex-col border border-border">
          {/* Window Title Bar */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-muted flex-shrink-0">
            <h3 className="text-base sm:text-lg font-medium text-foreground">
              {mode === 'compose' ? 'New Message' : mode === 'reply' ? 'Reply' : 'Forward'}
            </h3>
            <div className="flex items-center space-x-1">
              <button className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded hidden sm:inline-flex">
                <span className="text-muted-foreground text-sm">−</span>
              </button>
              <button className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded hidden sm:inline-flex">
                <span className="text-muted-foreground text-sm">⤢</span>
              </button>
              <button 
                className="w-6 h-6 flex items-center justify-center hover:bg-destructive/10 rounded"
                onClick={handleClose}
              >
                <span className="text-muted-foreground text-sm">×</span>
              </button>
            </div>
          </div>

          {/* Compose Form - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
            {/* To Field */}
            <div className="flex flex-col sm:flex-row sm:items-center border-b border-border py-2 gap-2 sm:gap-0">
              <span className="text-sm font-medium text-muted-foreground w-full sm:w-16 flex-shrink-0">To:</span>
              <EmailInput
                value={toEmails}
                onChange={setToEmails}
                placeholder="recipient@example.com"
                className="flex-1"
              />
              <div className="flex items-center space-x-2 ml-0 sm:ml-4 justify-end sm:justify-start">
                <button 
                  className={`text-xs px-2 py-1 rounded ${showCc ? 'text-primary font-medium bg-primary/10' : 'text-primary hover:text-primary/80 hover:bg-primary/5'}`}
                  onClick={() => setShowCc(!showCc)}
                >
                  Cc
                </button>
                <button 
                  className={`text-xs px-2 py-1 rounded ${showBcc ? 'text-primary font-medium bg-primary/10' : 'text-primary hover:text-primary/80 hover:bg-primary/5'}`}
                  onClick={() => setShowBcc(!showBcc)}
                >
                  Bcc
                </button>
              </div>
            </div>

            {/* CC Field - Conditional */}
            {showCc && (
              <div className="flex flex-col sm:flex-row sm:items-center border-b border-border py-2 gap-2 sm:gap-0">
                <span className="text-sm font-medium text-muted-foreground w-full sm:w-16 flex-shrink-0">Cc:</span>
                <EmailInput
                  value={ccEmails}
                  onChange={setCcEmails}
                  placeholder="cc@example.com"
                  className="flex-1"
                />
              </div>
            )}

            {/* BCC Field - Conditional */}
            {showBcc && (
              <div className="flex flex-col sm:flex-row sm:items-center border-b border-border py-2 gap-2 sm:gap-0">
                <span className="text-sm font-medium text-muted-foreground w-full sm:w-16 flex-shrink-0">Bcc:</span>
                <EmailInput
                  value={bccEmails}
                  onChange={setBccEmails}
                  placeholder="bcc@example.com"
                  className="flex-1"
                />
              </div>
            )}

            {/* Subject Field */}
            <div className="flex flex-col sm:flex-row sm:items-center border-b border-border py-2 gap-2 sm:gap-0">
              <span className="text-sm font-medium text-muted-foreground w-full sm:w-16 flex-shrink-0">Subject:</span>
              <Input
                value={composeData.subject}
                onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Subject"
                className="flex-1 border-0 p-0 focus:ring-0 focus:outline-none text-sm"
              />
            </div>

            {/* Message Body */}
            <div className="flex-1 min-h-[250px] sm:min-h-[300px]">
              <ReactQuill
                // defaultValue={composeData.content || ''}
                value={composeData.htmlContent || composeData.content}
                onChange={(value) => setComposeData(prev => ({ 
                  ...prev, 
                  content: value,
                  htmlContent: value 
                }))}
                placeholder="Write your message here..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    // ['link', 'image'],
                    // ['clean']
                  ]
                }}
                formats={[
                  'header',
                  'bold', 'italic', 'underline', 'strike',
                  'color', 'background',
                  'list', 'bullet',
                  'align',
                  'link', 'image'
                ]}
                style={{ height: window.innerWidth < 640 ? '200px' : '280px' }}
              />
            </div>

            {/* Attachments */}
            {selectedFiles.length > 0 && (
              <div className="border-t border-border pt-3 sm:pt-4">
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-muted rounded px-2 sm:px-3 py-1.5 sm:py-2 max-w-full">
                      <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-foreground truncate max-w-[150px] sm:max-w-none">{file.name}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">({formatFileSize(file.size)})</span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-muted-foreground hover:text-foreground ml-1 sm:ml-2 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="border-t border-border pt-3 sm:pt-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <div className="flex items-start sm:items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-destructive break-words">{error}</p>
                    </div>
                    <div className="ml-2 sm:ml-auto pl-3">
                      <button
                        onClick={() => setError(null)}
                        className="text-destructive hover:text-destructive/80 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions - Fixed */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 sm:p-4 border-t border-border bg-muted flex-shrink-0 gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 justify-center sm:justify-start">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="h-8 px-3 text-xs"
              >
                <Paperclip className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Attach</span>
              </Button>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
            </div>
            <div className="flex items-center space-x-2 justify-center sm:justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClose}
                className="h-8 px-3 sm:px-4 text-xs flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSavingDraft || !onSaveDraft}
                className="h-8 px-3 sm:px-4 text-xs disabled:opacity-50 flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
                <span className="sm:hidden">{isSavingDraft ? 'Saving...' : 'Draft'}</span>
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSending}
                size="sm"
                className="h-8 px-3 sm:px-4 text-xs bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 flex-1 sm:flex-none"
              >
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComposeModal;
