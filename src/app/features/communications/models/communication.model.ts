export type CommunicationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Communication {
  id: string;
  title: string;
  content: string;
  priority: CommunicationPriority;
  category?: string;
  is_published: boolean;
  published_at?: string;
  expires_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationRecipient {
  communication_id: string;
  user_id: string;
  read_at?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface CommunicationWithReadStatus extends Communication {
  read_at?: string;
  acknowledged_at?: string;
  recipient_count?: number;
  read_count?: number;
  acknowledged_count?: number;
}
