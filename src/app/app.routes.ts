import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { HomeComponent } from './features/home/home.component';
import { VoteComponent } from './features/vote/vote.component';
import { AddSuggestionComponent } from './features/add-suggestion/add-suggestion.component';
import { AuthCallbackComponent } from './core/components/auth-callback/auth-callback.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'callback',
    component: AuthCallbackComponent
  },
  {
    path: 'vote',
    component: VoteComponent,
    canActivate: [authGuard]
  },
  {
    path: 'add-suggestion',
    component: AddSuggestionComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
