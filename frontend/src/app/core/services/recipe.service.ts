import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { 
  Recipe, 
  RecipeListItem, 
  RecipeListResponse, 
  RecipeSearchParams, 
  Category, 
  SearchSuggestion,
  FilterOption
} from '../../shared/models/recipe.models';

@Injectable({
  providedIn: 'root'
})
export class RecipeService extends ApiService {
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  /**
   * Get paginated list of recipes with optional search and filtering
   */
  getRecipes(params: RecipeSearchParams = {}): Observable<RecipeListResponse> {
    this.loadingSubject.next(true);
    
    // Clean up undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );

    return this.get<RecipeListResponse>('/recipes/', cleanParams).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Get a single recipe by ID or slug
   */
  getRecipe(idOrSlug: string | number): Observable<Recipe> {
    return this.get<Recipe>(`/recipes/${idOrSlug}/`);
  }

  /**
   * Search recipes with advanced filtering
   */
  searchRecipes(params: RecipeSearchParams): Observable<RecipeListResponse> {
    this.loadingSubject.next(true);
    
    return this.post<RecipeListResponse>('/recipes/advanced-search/', params).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Get search suggestions for autocomplete
   */
  getSearchSuggestions(query: string): Observable<SearchSuggestion[]> {
    if (!query || query.length < 2) {
      return of([]);
    }
    
    return this.get<{ suggestions: SearchSuggestion[] }>('/recipes/search-suggestions/', { q: query }).pipe(
      map(response => response.suggestions || [])
    );
  }

  /**
   * Get popular search terms
   */
  getPopularSearches(): Observable<string[]> {
    return this.get<{ popular_searches: string[] }>('/recipes/popular-searches/').pipe(
      map(response => response.popular_searches || [])
    );
  }

  /**
   * Get all categories in hierarchical structure
   */
  getCategories(forceRefresh = false): Observable<Category[]> {
    if (!forceRefresh && this.categoriesSubject.value.length > 0) {
      return this.categories$;
    }

    return this.get<Category[]>('/categories/tree/').pipe(
      tap(categories => this.categoriesSubject.next(categories)),
      catchError(() => {
        // Return cached categories if API fails
        return this.categories$;
      })
    );
  }

  /**
   * Get recipes by category
   */
  getRecipesByCategory(categorySlug: string, params: RecipeSearchParams = {}): Observable<RecipeListResponse> {
    return this.get<RecipeListResponse>(`/categories/${categorySlug}/recipes/`, params);
  }

  /**
   * Get filter options for dynamic filtering UI
   */
  getFilterOptions(): Observable<{
    categories: FilterOption[];
    cookingMethods: FilterOption[];
    cuisineTypes: FilterOption[];
    tags: FilterOption[];
  }> {
    // This would ideally come from a dedicated API endpoint
    // For now, we'll derive from categories and use static data
    return this.getCategories().pipe(
      map(categories => ({
        categories: categories.map(cat => ({
          value: cat.slug,
          label: cat.name,
          count: cat.recipe_count
        })),
        cookingMethods: [
          { value: 'baking', label: 'Baking' },
          { value: 'grilling', label: 'Grilling' },
          { value: 'roasting', label: 'Roasting' },
          { value: 'sautéing', label: 'Sautéing' },
          { value: 'steaming', label: 'Steaming' },
          { value: 'boiling', label: 'Boiling' },
          { value: 'frying', label: 'Frying' },
          { value: 'slow-cooking', label: 'Slow Cooking' },
          { value: 'pressure-cooking', label: 'Pressure Cooking' }
        ],
        cuisineTypes: [
          { value: 'italian', label: 'Italian' },
          { value: 'mexican', label: 'Mexican' },
          { value: 'chinese', label: 'Chinese' },
          { value: 'indian', label: 'Indian' },
          { value: 'french', label: 'French' },
          { value: 'mediterranean', label: 'Mediterranean' },
          { value: 'thai', label: 'Thai' },
          { value: 'japanese', label: 'Japanese' },
          { value: 'american', label: 'American' },
          { value: 'greek', label: 'Greek' }
        ],
        tags: [] // This would be populated from an API endpoint
      }))
    );
  }

  /**
   * Toggle recipe favorite status
   */
  toggleFavorite(recipeId: string): Observable<{ is_favorited: boolean }> {
    return this.post<{ is_favorited: boolean }>(`/recipes/${recipeId}/toggle-favorite/`, {});
  }

  /**
   * Get user's favorite recipes
   */
  getFavoriteRecipes(params: RecipeSearchParams = {}): Observable<RecipeListResponse> {
    return this.get<RecipeListResponse>('/recipes/favorites/', params);
  }

  /**
   * Helper method to build search URL for sharing
   */
  buildSearchUrl(params: RecipeSearchParams): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.set(key, value.toString());
        }
      }
    });
    
    return queryParams.toString();
  }

  /**
   * Parse search URL parameters
   */
  parseSearchUrl(urlParams: URLSearchParams): RecipeSearchParams {
    const params: RecipeSearchParams = {};
    
    // Simple string parameters
    const stringParams = ['q', 'ordering', 'author', 'cuisine_type', 'cooking_method'];
    stringParams.forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        (params as any)[param] = value;
      }
    });
    
    // Number parameters
    const numberParams = ['min_prep_time', 'max_prep_time', 'min_cook_time', 'max_cook_time', 'min_rating', 'min_servings', 'max_servings', 'page', 'page_size'];
    numberParams.forEach(param => {
      const value = urlParams.get(param);
      if (value && !isNaN(Number(value))) {
        (params as any)[param] = Number(value);
      }
    });
    
    // Array parameters
    const arrayParams = ['categories', 'difficulty', 'dietary_restrictions', 'tags', 'ingredients_include', 'ingredients_exclude'];
    arrayParams.forEach(param => {
      const values = urlParams.getAll(param);
      if (values.length > 0) {
        (params as any)[param] = values;
      }
    });
    
    return params;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.categoriesSubject.next([]);
  }
}