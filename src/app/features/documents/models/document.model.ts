export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  downloadUrl?: string;
  category?: DocumentCategory | null;
  categoryId?: string | null;
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  isEncrypted: boolean;
  expiresAt?: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // For UI purposes
  isSelected?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  status?: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface DocumentUploadProgress {
  id: string;
  filename: string;
  file?: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface DocumentFilter {
  search?: string;
  fileType?: string;
  categoryId?: string;
  classification?: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  isEncrypted?: boolean;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'title' | 'createdAt' | 'fileSize' | 'classification';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif'
];
