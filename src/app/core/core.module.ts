import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { I18nModule } from './i18n/i18n.module';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { AuthService } from './services/auth.service';
import { SupabaseService } from './services/supabase.service';
import { StorageService } from './services/storage.service';
import { throwIfAlreadyLoaded } from './utils/module-import-guard';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    MatSnackBarModule,
    I18nModule
  ],
  exports: [
    I18nModule
  ],
  providers: [
    AuthService,
    SupabaseService,
    StorageService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }
}
