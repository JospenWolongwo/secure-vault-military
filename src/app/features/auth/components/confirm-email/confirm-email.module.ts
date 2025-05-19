import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmEmailComponent } from './confirm-email.component';

@NgModule({
  declarations: [],
  imports: [
    ConfirmEmailComponent,
    CommonModule,
    RouterModule.forChild([
      { path: '', component: ConfirmEmailComponent }
    ]),
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslateModule.forChild()
  ]
})
export class ConfirmEmailModule { }
