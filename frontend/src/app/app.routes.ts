import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'callback',
    loadComponent: () => import('./core/components/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  },
  {
    path: 'vote',
    loadComponent: () => import('./pages/vote/vote.component').then(m => m.VoteComponent),
    canActivate: [authGuard]
  },
  {
    path: 'suggest',
    loadComponent: () => import('./pages/suggest/suggest.component').then(m => m.SuggestComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
