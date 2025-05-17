// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// API Configuration
export const API_CONFIG = {
  baseUrl: "http://localhost:3000/api",
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    refreshToken: "/auth/refresh-token",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    verifyEmail: "/auth/verify-email",
    me: "/auth/me",
  },
  users: {
    base: "/users",
    profile: "/users/profile",
    changePassword: "/users/change-password",
  },
  documents: {
    base: "/documents",
    upload: "/documents/upload",
    download: (id: string) => `/documents/${id}/download`,
    share: (id: string) => `/documents/${id}/share`,
  },
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: "https://bmkvlqeityoqoijuwify.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJta3ZscWVpdHlvcW9panV3aWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NzcwNTIsImV4cCI6MjA2MzA1MzA1Mn0.ZRJZjcWgseNQoAL5TvhG8-06aC6xFElBduahdWiXiLU",
  storageBucket: "documents",
  storageUrl: "https://bmkvlqeityoqoijuwify.supabase.co/storage/v1/s3",
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
};

export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api",
  appName: "SecureVault Military",
  appVersion: "1.0.0",
  enableDebug: true,

  // Authentication
  auth: {
    tokenKey: "auth_token",
    refreshTokenKey: "refresh_token",
    userKey: "current_user",
    tokenExpiration: 3600, // 1 hour in seconds
    refreshTokenExpiration: 2592000, // 30 days in seconds
  },

  // Features
  features: {
    registration: true,
    twoFactorAuth: true,
    documentUpload: true,
    announcements: true,
    auditLog: true,
    userManagement: true,
    roleBasedAccess: true,
  },

  // UI Settings
  ui: {
    defaultLanguage: "en",
    supportedLanguages: ["en", "fr"],
    theme: "light",
    enableDarkMode: true,
    enableNotifications: true,
    enableAnalytics: false,
  },

  // External Services
  services: {
    supabase: {
      url: "", // Add your Supabase URL here
      key: "", // Add your Supabase anon key here
    },
    sentry: {
      dsn: "", // Add your Sentry DSN here if needed
    },
  },

  // Security
  security: {
    encryptionKey: "dev-encryption-key-32-char-long-12345",
    password: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    session: {
      idleTimeout: 1800, // 30 minutes in seconds
      warningBeforeTimeout: 300, // 5 minutes in seconds
    },
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
