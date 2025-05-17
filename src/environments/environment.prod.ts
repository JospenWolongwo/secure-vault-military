// API Configuration
export const API_CONFIG = {
  baseUrl: 'https://api.securevault-military.cm/api',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refreshToken: '/auth/refresh-token',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    me: '/auth/me'
  },
  users: {
    base: '/users',
    profile: '/users/profile',
    changePassword: '/users/change-password'
  },
  documents: {
    base: '/documents',
    upload: '/documents/upload',
    download: (id: string) => `/documents/${id}/download`,
    share: (id: string) => `/documents/${id}/share`
  }
};

export const environment = {
  production: true,
  apiUrl: 'https://api.securevault-military.cm/api',
  appName: 'SecureVault Military',
  appVersion: '1.0.0',
  enableDebug: false,
  
  // Authentication
  auth: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    userKey: 'current_user',
    tokenExpiration: 3600, // 1 hour in seconds
    refreshTokenExpiration: 2592000, // 30 days in seconds
  },
  
  // Features
  features: {
    registration: true, // Set to false to disable registration in production
    twoFactorAuth: true, // Enable/disable two-factor authentication
    documentUpload: true,
    announcements: true,
    auditLog: true,
    userManagement: true,
    roleBasedAccess: true
  },
  
  // UI Settings
  ui: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'fr'],
    theme: 'light',
    enableDarkMode: true,
    enableNotifications: true,
    enableAnalytics: true
  },
  
  // External Services
  services: {
    supabase: {
      url: 'https://your-supabase-url.supabase.co', // Add your production Supabase URL
      key: 'your-supabase-anon-key' // Add your production Supabase anon key
    },
    sentry: {
      dsn: '' // Add your production Sentry DSN if needed
    }
  },
  
  // Security
  security: {
    encryptionKey: 'prod-encryption-key-32-char-long-12345', // In a real app, use a secure key management system
    password: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    session: {
      idleTimeout: 1800, // 30 minutes in seconds
      warningBeforeTimeout: 300, // 5 minutes in seconds
    }
  }
};
