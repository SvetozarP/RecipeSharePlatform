import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const recipeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./recipe-list/recipe-list.component').then(m => m.RecipeListComponent),
    data: { title: 'Browse Recipes' }
  },
  {
    path: 'create',
    loadComponent: () => import('./recipe-form/recipe-form.component').then(m => m.RecipeFormComponent),
    canActivate: [AuthGuard],
    data: { title: 'Create Recipe' }
  },
  {
    path: ':id',
    loadComponent: () => import('./recipe-detail/recipe-detail.component').then(m => m.RecipeDetailComponent),
    data: { title: 'Recipe Details' }
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./recipe-form/recipe-form.component').then(m => m.RecipeFormComponent),
    canActivate: [AuthGuard],
    data: { title: 'Edit Recipe' }
  }
]; 