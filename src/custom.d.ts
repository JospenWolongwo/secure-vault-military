// This file contains type definitions for environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NG_APP_SUPABASE_URL?: string;
    NG_APP_SUPABASE_ANON_KEY?: string;
    NG_APP_ENCRYPTION_KEY?: string;
  }
}
