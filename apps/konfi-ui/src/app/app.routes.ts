import { Route } from '@angular/router';
import { NxWelcome } from './nx-welcome';
import { TableComponent } from './views/table.component';
import { NameInputComponent } from './components/name-input.component';

export const appRoutes: Route[] = [
  {
    path: 'brunch/create',
    loadComponent: () =>
      import('./views/brunch-create.component').then(
        (value) => value.BrunchCreateComponent
      ),
    title: 'Create Brunch',
  },
  {
    path: 'table/create',
    loadComponent: () =>
      import('./views/table-create.component').then(
        (value) => value.TableCreateComponent
      ),
    title: 'Create Breakfast Table',
  },
  {
    path: 'table/admin/:id',
    loadComponent: () =>
      import('./views/table-admin.component').then(
        (value) => value.TableAdminComponent
      ),
    title: 'Admin Breakfast Table',
  },
  {
    path: 'table/:id',
    loadComponent: () =>
      import('./views/table.component').then((value) => value.TableComponent),
    title: 'Breakfast Table',
  },
  {
    path: '',
    pathMatch: 'full',
    title: 'Welcome to Konfi',
    loadComponent: () =>
      import('./views/landing.component').then(
        (value) => value.LandingComponent
      ),
  },
  {
    path: '**',
    redirectTo: '/',
    title: 'Welcome',
  },
];
