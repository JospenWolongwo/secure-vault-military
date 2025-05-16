// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:4200',
  appName: 'SecureVault Military (Dev)',
  version: '0.0.1',
  supabase: {
    url: import.meta.env['NG_APP_SUPABASE_URL'] || '',
    key: import.meta.env['NG_APP_SUPABASE_ANON_KEY'] || ''
  },
  encryptionKey: import.meta.env['NG_APP_ENCRYPTION_KEY'] || 'dev-encryption-key-32-char-long-12345',
  features: {
    registration: true,
    twoFactorAuth: true,
    documentUpload: true,
    announcements: true
  },
  debug: true
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
