import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'gallery',
    loadComponent: () => import('./components/gallery/gallery.component').then(m => m.GalleryComponent)
  },
  {
    path: 'projection',
    loadComponent: () => import('./components/projection/projection.component').then(m => m.ProjectionComponent)
  },
  {
    path: 'mine',
    loadComponent: () => import('./components/mine/mine.component').then(m => m.MineComponent)
  },
  { path: '', redirectTo: 'gallery', pathMatch: 'full' }
];
