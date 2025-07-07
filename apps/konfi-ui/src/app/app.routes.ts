import { Route } from '@angular/router';
import {NxWelcome} from "./nx-welcome";
import {TableComponent} from "./views/table.component";

export const appRoutes: Route[] = [
  {
    path: 'table/:id',
    loadComponent: () => import('./views/table.component').then((value) => value.TableComponent),
    title: 'Brekfast Table',
  },
  {
    path: 't/:id',
    component: TableComponent,
    title: 'Brekfast Table',
  },
  {
    path: '**',
    component: NxWelcome,
    title: 'Welcome',
  }
];
