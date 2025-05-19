export interface StatCard {
  title: string;
  key: string;
  value: string | number;
  change: number;
  color: string;
  icon: string;
  changeType: 'increase' | 'decrease' | 'neutral';
}

export interface ActivityItem {
  type: string;
  icon: string;
  title: string;
  description: string;
  time: string;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  type: 'upload' | 'share' | 'edit' | 'delete' | 'login';
}

export interface StorageUsage {
  used: string;
  total: string;
  percentage: number;
}
