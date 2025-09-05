import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'lists',
    loadComponent: () =>
      import('./components/grocery-lists/grocery-lists.component').then(
        (m) => m.GroceryListsComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'lists/:id',
    loadComponent: () =>
      import('./components/grocery-list-detail/grocery-list-detail.component').then(
        (m) => m.GroceryListDetailComponent
      ),
    canActivate: [AuthGuard],
  },
];
