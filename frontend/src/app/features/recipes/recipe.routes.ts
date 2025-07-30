import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const recipeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./recipe-list/recipe-list.component').then(m => m.RecipeListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./recipe-form/recipe-form.component').then(m => m.RecipeFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    loadComponent: () => import('./recipe-detail/recipe-detail.component').then(m => m.RecipeDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./recipe-form/recipe-form.component').then(m => m.RecipeFormComponent),
    canActivate: [AuthGuard]
  }
]; 