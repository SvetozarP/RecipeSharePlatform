import { Routes } from '@angular/router';

export const recipeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./recipe-list/recipe-list.component').then(m => m.RecipeListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./recipe-detail/recipe-detail.component').then(m => m.RecipeDetailComponent)
  }
]; 