export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parent?: number;
  children?: Category[];
  recipe_count?: number;
  is_active: boolean;
  ordering: number;
}

export interface RecipeImage {
  id: number;
  image: string;
  alt_text?: string;
  is_primary: boolean;
  ordering: number;
}

export interface Rating {
  id: string;
  recipe?: string; // UUID of recipe
  user?: string; // UUID of user
  user_email?: string;
  user_name?: string;
  recipe_title?: string;
  rating: number; // 1-5
  review?: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  star_display?: string;
  created_at: string;
  updated_at: string;
}

export interface RatingCreate {
  recipe: string; // UUID of recipe
  rating: number; // 1-5
  review?: string;
}

export interface RatingUpdate {
  rating: number;
  review?: string;
}

export interface RatingListItem {
  id: string;
  rating: number;
  review?: string;
  user_name: string;
  star_display: string;
  helpful_count: number;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface RatingStats {
  average_rating: number;
  total_ratings: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface Nutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface Recipe {
  id: string; // Backend returns string UUID
  title: string;
  slug: string;
  description: string;
  ingredients: Ingredient[] | string[]; // Support both formats for backward compatibility
  instructions: string[];
  prep_time: number;
  cook_time: number;
  total_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cooking_method: string;
  cuisine_type?: string;

  tags: string[];
  nutrition_info?: Nutrition;
  images: RecipeImage[];
  main_image_url?: string; // Main image URL from backend
  thumbnail_url?: string; // Thumbnail URL from backend
  has_images?: boolean; // Whether recipe has images
  categories: Category[];
  author: {
    id: string; // Backend returns string UUID for user ID
    username: string;
    firstName: string;
    lastName: string;
  };
  rating_stats: RatingStats;
  current_user_rating?: Rating;
  is_published: boolean;
  is_favorited?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeListItem {
  id: string; // Backend returns string UUID
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  total_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cooking_method: string;
  thumbnail_url?: string;
  
  // Author information (backend returns author_name as string)
  author_name: string;
  
  // Categories and tags
  categories: Category[];
  category_names: string[];
  tags: string[];
  
  // Optional fields that might not be included in list view
  rating_stats?: RatingStats;
  
  // Metadata
  is_published: boolean;
  is_favorited?: boolean;
  created_at: string;
}

export interface RecipeSearchParams {
  q?: string; // Search query
  categories?: number[]; // Category IDs
  category_slugs?: string[]; // Category slugs  
  difficulty?: string[];
  dietary_restrictions?: string[];
  cooking_method?: string[];
  min_prep_time?: number;
  max_prep_time?: number;
  min_cook_time?: number;
  max_cook_time?: number;
  min_rating?: number;
  tags?: string[];
  author?: string;
  ingredients_include?: string[];
  ingredients_exclude?: string[];
  min_servings?: number;
  max_servings?: number;
  ordering?: string; // '-created_at', 'total_time', '-rating_stats__average_rating', etc.
  page?: number;
  page_size?: number;
}

export interface SearchSuggestion {
  type: 'recipe' | 'ingredient' | 'category' | 'tag' | 'author';
  value: string;
  display: string;
  count?: number;
}

export interface RecipeListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RecipeListItem[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface SortOption {
  value: string;
  label: string;
  direction: 'asc' | 'desc';
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First', direction: 'desc' },
  { value: 'oldest', label: 'Oldest First', direction: 'asc' },
  { value: 'rating', label: 'Highest Rated', direction: 'desc' },
  { value: 'popularity', label: 'Most Popular', direction: 'desc' },
  { value: 'prep_time', label: 'Quickest Prep', direction: 'asc' },
  { value: 'cook_time', label: 'Quickest Cook', direction: 'asc' },
  { value: 'total_time', label: 'Shortest Total Time', direction: 'asc' },
  { value: 'title', label: 'Alphabetical A-Z', direction: 'asc' }
];

export const DIFFICULTY_OPTIONS: FilterOption[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

export const DIETARY_RESTRICTION_OPTIONS: FilterOption[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'dairy-free', label: 'Dairy Free' },
  { value: 'nut-free', label: 'Nut Free' },
  { value: 'low-carb', label: 'Low Carb' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'whole30', label: 'Whole30' },
  { value: 'pescatarian', label: 'Pescatarian' }
];