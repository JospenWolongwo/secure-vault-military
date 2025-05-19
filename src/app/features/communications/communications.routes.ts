import { Routes } from '@angular/router';
import { AnnouncementBoardComponent } from './components/announcement-board/announcement-board.component';
import { AnnouncementDetailComponent } from './components/announcement-detail/announcement-detail.component';
import { CreateAnnouncementComponent } from './components/create-announcement/create-announcement.component';
import { adminGuard } from '../../core/guards/admin.guard';
import { AuthGuard } from '../../core/guards/auth.guard';

export const COMMUNICATIONS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: AnnouncementBoardComponent,
        title: 'Announcements | SecureVault Military'
      },
      {
        path: 'create',
        component: CreateAnnouncementComponent,
        canActivate: [adminGuard],
        title: 'Create Announcement | SecureVault Military'
      },
      {
        path: 'edit/:id',
        component: CreateAnnouncementComponent,
        canActivate: [adminGuard],
        title: 'Edit Announcement | SecureVault Military'
      },
      {
        path: ':id',
        component: AnnouncementDetailComponent,
        title: 'Announcement Details | SecureVault Military'
      }
    ]
  }
];
