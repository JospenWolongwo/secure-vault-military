// Global TypeScript declarations for the SecureVault Military application

type Environment = 'development' | 'production' | 'test';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Environment variables
      NODE_ENV: Environment;
      
      // Application settings
      NG_APP_ENV?: string;
      NG_APP_VERSION?: string;
      
      // API and Services
      NG_APP_API_URL?: string;
      NG_APP_SUPABASE_URL?: string;
      NG_APP_SUPABASE_ANON_KEY?: string;
      NG_APP_SENTRY_DSN?: string;
      
      // Feature flags
      NG_APP_FEATURE_REGISTRATION?: string;
      NG_APP_FEATURE_TWO_FACTOR_AUTH?: string;
      
      // Security
      NG_APP_ENCRYPTION_KEY?: string;
      
      // Any other environment variables
      [key: string]: string | undefined;
    }
  }


  // Extend the Window interface
  interface Window {
    // Add any global variables that are added to the window object
    ENV: any;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any;
    
    // Add any other global variables used in the application
    [key: string]: any;
  }
}

// This export is needed to make this file a module
export {};
