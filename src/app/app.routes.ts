import { Routes } from '@angular/router';
import { authGuard } from './store/guards/auth.guard';
import { adminAndDeliveryGuard, allUsersGuard } from './store/guards/user-type.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'clients',
    loadComponent: () => import('./users/client-list/client-list.component').then(m => m.ClientListComponent),
    canActivate: [authGuard, adminAndDeliveryGuard],
  },
  {
    path: '',
    loadComponent: () => import('./calendar/calendar-page/calendar.page').then(m => m.CalendarPageComponent),
    canActivate: [authGuard, allUsersGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
