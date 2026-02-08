import type { User } from './auth';
import type { Department } from './department';

export interface Document {
  id: string;
  title: string;
  contentText?: string;
  description?: string;
  keywords: string[];
  isPublic: boolean;
  isGlobalView?: boolean;
  isGlobalEdit?: boolean;
  originalFilename?: string;
  mimeType?: string;
  pageCount?: number;
  checksum?: string;
  size?: number;
  originalFileUrl?: string;
  thumbnailUrl?: string;
  pdfUrl?: string;
  ownerId?: string;
  correspondentId?: string;
  documentTypeId?: string;
  viewUserIds: string[];
  editUserIds: string[];
  deleteUserIds: string[];
  viewDepartmentIds: string[];
  editDepartmentIds: string[];
  deleteDepartmentIds: string[];
  createdAt: string;
  modifiedAt: string;
  addedAt: string;
  owner?: Pick<User, 'id' | 'fullName' | 'email'>;
  correspondent?: Correspondent;
  documentType?: DocumentType;
  tags?: Tag[];
  comments?: Comment[];
  viewUsers?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>[];
  editUsers?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>[];
  deleteUsers?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>[];
  viewDepartments?: Pick<Department, 'id' | 'name' | 'code'>[];
  editDepartments?: Pick<Department, 'id' | 'name' | 'code'>[];
  deleteDepartments?: Pick<Department, 'id' | 'name' | 'code'>[];
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  slug: string;
  match?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Correspondent {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentType {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  note: string;
  created: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'fullName' | 'email' | 'avatar'>;
  document?: Pick<Document, 'id' | 'title'>;
}

export interface DocumentFilters {
  search?: string;
  tagIds?: string[];
  correspondentId?: string;
  documentTypeId?: string;
  ownerId?: string;
  isPublic?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'modifiedAt' | 'title' | 'size';
  sortOrder?: 'asc' | 'desc';
}
