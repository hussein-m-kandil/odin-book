import { authGuard } from './auth/auth-guard';
import { Routes } from '@angular/router';

const loadAuthForm = async () => (await import('./auth/auth-form')).AuthForm;

export const routes: Routes = [
  { path: 'signin', canActivate: [authGuard], title: 'Sing In', loadComponent: loadAuthForm },
  { path: 'signup', canActivate: [authGuard], title: 'Sing Up', loadComponent: loadAuthForm },
];
