/**
 * User roles for role-based access control
 */
export enum Role {
  Admin = 'admin',
  Officer = 'officer',
  Soldier = 'soldier',
  Personnel = 'personnel',
}

/**
 * User rank in the military hierarchy
 */
export enum Rank {
  General = 'General',
  Colonel = 'Colonel',
  Major = 'Major',
  Captain = 'Captain',
  Lieutenant = 'Lieutenant',
  Sergeant = 'Sergeant',
  Corporal = 'Corporal',
  Private = 'Private',
}

/**
 * User interface representing a military personnel
 */
export interface User {
  /** Unique identifier */
  id: string;
  
  /** Email address (also used as username) */
  email: string;
  
  /** First name */
  firstName: string;
  
  /** Last name */
  lastName: string;
  
  /** Full name (computed) */
  fullName?: string;
  
  /** Military ID number */
  militaryId: string;
  
  /** Role in the system */
  role: Role | string;
  
  /** Military rank */
  rank: Rank | string;
  
  /** Unit/Division */
  unit: string;
  
  /** Phone number */
  phoneNumber?: string;
  
  /** Profile image URL */
  profileImage?: string;
  
  /** Whether the user is active */
  isActive?: boolean;
  
  /** Date when the user was created */
  createdAt?: Date | string;
  
  /** Date when the user was last updated */
  updatedAt?: Date | string;
  
  /** Last login timestamp */
  lastLogin?: Date | string;
  
  /** Whether the user has completed the initial setup */
  hasCompletedSetup?: boolean;
  
  /** Additional metadata */
  metadata?: {
    [key: string]: any;
  };
}

/**
 * User credentials for authentication
 */
export interface Credentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * User registration data
 */
export interface RegistrationData extends Credentials {
  firstName: string;
  lastName: string;
  militaryId: string;
  confirmPassword: string;
  rank: string;
  unit: string;
  phoneNumber?: string;
}

/**
 * Password reset request data
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation data
 */
export interface PasswordResetConfirm {
  token: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * User profile update data
 */
export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  [key: string]: any;
}
