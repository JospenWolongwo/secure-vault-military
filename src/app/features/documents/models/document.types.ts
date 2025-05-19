export interface Document {
  id?: string;
  title: string;
  fileType?: string;
  fileSize?: number;
  updatedAt?: Date | string;
  // Add other document properties as needed
}

export interface DocumentFilter {
  searchTerm?: string;
  filterBy?: 'all' | 'recent' | 'favorites';
  // Add other filter properties as needed
}
