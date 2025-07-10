import {Routes} from '@angular/router';

export const routes: Routes = [
  {path: 'home', loadChildren: () => import('./home/home.component').then(m => m.HomeComponent)},
  {path: '**', redirectTo: 'home'}
];
