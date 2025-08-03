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
  FilterOption,
  Rating,
  RatingCreate,
  RatingUpdate,
  RatingListItem,
  RatingStats
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

    // Check if we need to use advanced search endpoint for complex sorting
    const complexSortOptions = ['rating', 'popularity'];
    const needsAdvancedSearch = cleanParams['ordering'] && complexSortOptions.includes(cleanParams['ordering'] as string);

    if (needsAdvancedSearch) {
      // Use advanced search endpoint for complex sorting
      const searchBody: any = {
        ...cleanParams,
        order_by: cleanParams['ordering'], // Advanced search uses order_by instead of ordering
        page: cleanParams['page'] || 1,
        page_size: cleanParams['page_size'] || 24
      };
      
      // Remove ordering from searchBody since we're using order_by
      delete searchBody['ordering'];

      return this.post<RecipeListResponse>('/recipes/advanced-search/', searchBody).pipe(
        tap(() => this.loadingSubject.next(false)),
        catchError(error => {
          this.loadingSubject.next(false);
          throw error;
        })
      );
    } else {
      // Use regular list endpoint for simple sorting
      return this.get<RecipeListResponse>('/recipes/', cleanParams).pipe(
        tap(() => this.loadingSubject.next(false)),
        catchError(error => {
          this.loadingSubject.next(false);
          throw error;
        })
      );
    }
  }

  /**
   * Get a single recipe by ID or slug
   */
  getRecipe(idOrSlug: string | number): Observable<Recipe> {
    return this.get<Recipe>(`/recipes/${idOrSlug}/`);
  }

  /**
   * Search recipes with text query
   */
  searchRecipes(params: RecipeSearchParams): Observable<RecipeListResponse> {
    this.loadingSubject.next(true);
    
    // Use the search endpoint for text queries
    const searchParams: any = {
      q: params.q,
      order_by: params.ordering || 'relevance',
      page: params.page || 1,
      page_size: params.page_size || 24
    };

    return this.get<RecipeListResponse>('/recipes/search/', searchParams).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Search error:', error);
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

    // Try tree endpoint first, fallback to regular categories if it fails
    return this.get<Category[]>('/recipes/categories/tree/').pipe(
      catchError(() => {
        console.warn('Categories tree endpoint not available, falling back to regular categories list');
        return this.get<Category[]>('/recipes/categories/').pipe(
          catchError(() => {
            console.error('Both categories endpoints failed, returning default categories');
            // Return some default categories so the form still works
            return of([
              { id: 1, name: 'Main Dishes', slug: 'main-dishes', is_active: true, ordering: 1 },
              { id: 2, name: 'Appetizers', slug: 'appetizers', is_active: true, ordering: 2 },
              { id: 3, name: 'Desserts', slug: 'desserts', is_active: true, ordering: 3 },
              { id: 4, name: 'Beverages', slug: 'beverages', is_active: true, ordering: 4 }
            ] as Category[]);
          })
        );
      }),
      tap(categories => this.categoriesSubject.next(categories))
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
    // Use backend API for favorites management
    return this.post<{ is_favorite: boolean; message: string }>('/recipes/favorites/toggle/', { recipe_id: recipeId }).pipe(
      map(response => ({ is_favorited: response.is_favorite })),
      catchError(error => {
        console.error('Failed to toggle favorite:', error);
        return of({ is_favorited: false });
      })
    );
  }

  /**
   * Get user's favorite recipes
   */
  getFavoriteRecipes(params: RecipeSearchParams = {}): Observable<RecipeListResponse> {
    // Get favorite recipe IDs from localStorage
    const FAVORITES_KEY = 'user_favorite_recipes';
    
    try {
      let favoriteIds: string[] = [];
      const favoritesJson = localStorage.getItem(FAVORITES_KEY);
      if (favoritesJson) {
        favoriteIds = JSON.parse(favoritesJson);
      }
      
      if (favoriteIds.length === 0) {
        // Return empty result if no favorites
        return of({
          count: 0,
          next: null,
          previous: null,
          results: []
        });
      }
      
      // For now, return a basic structure
      // In a real implementation, you'd fetch the actual recipe objects
      return of({
        count: favoriteIds.length,
        next: null,
        previous: null,
        results: [] // Would need to fetch actual recipes by IDs
      });
    } catch (error) {
      console.error('Failed to get favorite recipes:', error);
      return of({
        count: 0,
        next: null,
        previous: null,
        results: []
      });
    }
  }

  /**
   * Check if a recipe is favorited
   */
  isFavorite(recipeId: string): boolean {
    const FAVORITES_KEY = 'user_favorite_recipes';
    
    try {
      const favoritesJson = localStorage.getItem(FAVORITES_KEY);
      if (favoritesJson) {
        const favorites: string[] = JSON.parse(favoritesJson);
        return favorites.includes(recipeId);
      }
      return false;
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      return false;
    }
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
    const arrayParams = ['categories', 'category_slugs', 'difficulty', 'dietary_restrictions', 'tags', 'ingredients_include', 'ingredients_exclude'];
    arrayParams.forEach(param => {
      const values = urlParams.getAll(param);
      if (values.length > 0) {
        (params as any)[param] = values;
      }
    });
    
    return params;
  }

  /**
   * Create a new recipe
   */
  createRecipe(recipeData: FormData): Observable<Recipe> {
    return this.post<Recipe>('/recipes/', recipeData);
  }

  /**
   * Update an existing recipe
   */
  updateRecipe(id: string | number, recipeData: FormData): Observable<Recipe> {
    return this.put<Recipe>(`/recipes/${id}/`, recipeData);
  }

  /**
   * Delete a recipe
   */
  deleteRecipe(id: string | number): Observable<void> {
    return this.delete<void>(`/recipes/${id}/`);
  }

  /**
   * Upload image for a recipe
   */
  uploadRecipeImage(id: string | number, imageFile: File): Observable<{ image_url: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.post<{ image_url: string }>(`/recipes/${id}/upload_image/`, formData);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.categoriesSubject.next([]);
  }

  // ===== RATING METHODS =====

  /**
   * Get ratings for a specific recipe
   */
  getRecipeRatings(recipeId: string, params: { page?: number; page_size?: number; ordering?: string } = {}): Observable<{ count: number; next: string | null; previous: string | null; results: RatingListItem[] }> {
    const searchParams = { recipe_id: recipeId, ...params };
    return this.get<{ count: number; next: string | null; previous: string | null; results: RatingListItem[] }>('/recipes/ratings/', searchParams);
  }

  /**
   * Get rating statistics for a specific recipe
   */
  getRecipeRatingStats(recipeId: string): Observable<RatingStats> {
    return this.get<RatingStats>('/recipes/ratings/recipe_stats/', { recipe_id: recipeId });
  }

  /**
   * Create a new rating for a recipe
   */
  createRating(ratingData: RatingCreate): Observable<Rating> {
    return this.post<Rating>('/recipes/ratings/', ratingData);
  }

  /**
   * Update an existing rating
   */
  updateRating(ratingId: string, ratingData: RatingUpdate): Observable<Rating> {
    return this.put<Rating>(`/recipes/ratings/${ratingId}/`, ratingData);
  }

  /**
   * Delete a rating
   */
  deleteRating(ratingId: string): Observable<void> {
    return this.delete<void>(`/recipes/ratings/${ratingId}/`);
  }

  /**
   * Mark a rating as helpful
   */
  markRatingHelpful(ratingId: string): Observable<{ message: string; helpful_count: number }> {
    return this.post<{ message: string; helpful_count: number }>(`/recipes/ratings/${ratingId}/mark_helpful/`, {});
  }

  /**
   * Get current user's ratings
   */
  getMyRatings(params: { page?: number; page_size?: number } = {}): Observable<{ count: number; next: string | null; previous: string | null; results: RatingListItem[] }> {
    return this.get<{ count: number; next: string | null; previous: string | null; results: RatingListItem[] }>('/recipes/ratings/my_ratings/', params);
  }

  /**
   * Get current user's rating for a specific recipe
   */
  getMyRatingForRecipe(recipeId: string): Observable<Rating | null> {
    return this.get<{ count: number; results: Rating[] }>('/recipes/ratings/', { recipe_id: recipeId }).pipe(
      map(response => {
        // Filter to find current user's rating (backend should already filter this)
        return response.results && response.results.length > 0 ? response.results[0] : null;
      }),
      catchError(() => of(null))
    );
  }
}