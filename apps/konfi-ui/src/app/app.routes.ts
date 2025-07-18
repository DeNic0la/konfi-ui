import { Route } from '@angular/router';
import { NxWelcome } from './nx-welcome';
import { TableComponent } from './views/table.component';
import { NameInputComponent } from './components/name-input.component';

export const appRoutes: Route[] = [
  {
    path: 'brunch/create',
    loadComponent: () => import('./views/brunch-create.component').then(value => value.BrunchCreateComponent),
    title: 'Create Brunch'
  },
  {
    path: 'table/admin/:id',
    loadComponent: () =>
      import('./views/table-admin.component').then((value) => value.TableAdminComponent),
    title: 'Admin Brekfast Table',
  },
  {
    path: 'table/:id',
    loadComponent: () =>
      import('./views/table.component').then((value) => value.TableComponent),
    title: 'Brekfast Table',
  },
  {
    path: '',
    pathMatch: "full",
    title: 'Create Brekfast Table',
    loadComponent: () => import('./views/table-create.component').then(value => value.TableCreateComponent)
  },
  {
    path: '**',
    redirectTo: '/',
    title: 'Welcome',
  },
];
