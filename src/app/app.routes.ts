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
    path: 'calendar/:userId',
    loadComponent: () => import('./calendar/calendar-page/calendar.page').then(m => m.CalendarPageComponent),
    canActivate: [authGuard, adminAndDeliveryGuard],
  },
  {
    path: 'patterns',
    loadComponent: () => import('./patterns/patterns.component').then(m => m.PatternsComponent),
    canActivate: [authGuard, allUsersGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
