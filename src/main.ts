import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';

import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { appConfig } from './app/app.config';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
