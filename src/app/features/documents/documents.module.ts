import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Routes } from '@angular/router';

import { DocumentUploadComponent } from './components/document-upload/document-upload.component';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { DocumentService } from './services/document.service';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'upload',
        component: DocumentUploadComponent,
        data: { title: 'Upload Documents' }
      },
      {
        path: '',
        component: DocumentListComponent, // We'll create this component later
        data: { title: 'My Documents' }
      }
    ]
  }
];

@NgModule({
  imports: [
    // Standalone components
    DocumentUploadComponent,
    DocumentListComponent,
    
    // Angular modules
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    
    // Material modules
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatIconModule,
    MatListModule,
    MatSelectModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    
    // Standalone pipe
    FileSizePipe
  ],
  providers: [
    DocumentService,
    DatePipe
  ]
})
export class DocumentsModule { }
