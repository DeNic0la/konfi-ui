import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '/table/:id',
    loadComponent: () => import('./views/table').then((value) => value.Table),
    title: 'Brekfast Table',
  },
];
