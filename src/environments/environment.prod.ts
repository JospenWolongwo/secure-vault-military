export const environment = {
  production: true,
  apiUrl: 'https://api.securevault-military.cm',
  appName: 'SecureVault Military',
  version: '1.0.0',
  supabase: {
    url: import.meta.env['NG_APP_SUPABASE_URL'] || '',
    key: import.meta.env['NG_APP_SUPABASE_ANON_KEY'] || ''
  },
  encryptionKey: import.meta.env['NG_APP_ENCRYPTION_KEY'],
  features: {
    registration: import.meta.env['NG_APP_FEATURE_REGISTRATION'] === 'true',
    twoFactorAuth: import.meta.env['NG_APP_FEATURE_TWO_FACTOR_AUTH'] === 'true',
    documentUpload: true,
    announcements: true
  },
  debug: false
};
