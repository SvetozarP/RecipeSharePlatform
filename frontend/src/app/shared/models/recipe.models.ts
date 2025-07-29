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
  id: number;
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  rating: number;
  review?: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface Nutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
}

export interface Recipe {
  id: number;
  title: string;
  slug: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  total_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cooking_method: string;
  cuisine_type?: string;
  dietary_restrictions: string[];
  tags: string[];
  nutrition_info?: Nutrition;
  images: RecipeImage[];
  categories: Category[];
  author: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  rating_stats: {
    average_rating: number;
    total_ratings: number;
    rating_distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
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
  dietary_restrictions?: string[];
  rating_stats?: {
    average_rating: number;
    total_ratings: number;
  };
  
  // Metadata
  is_published: boolean;
  is_favorited?: boolean;
  created_at: string;
}

export interface RecipeSearchParams {
  q?: string; // Search query
  categories?: string[]; // Category slugs
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
  { value: '-created_at', label: 'Newest First', direction: 'desc' },
  { value: 'created_at', label: 'Oldest First', direction: 'asc' },
  { value: '-rating_stats__average_rating', label: 'Highest Rated', direction: 'desc' },
  { value: 'rating_stats__average_rating', label: 'Lowest Rated', direction: 'asc' },
  { value: '-rating_stats__total_ratings', label: 'Most Reviews', direction: 'desc' },
  { value: '-view_count', label: 'Most Popular', direction: 'desc' },
  { value: 'prep_time', label: 'Quickest Prep', direction: 'asc' },
  { value: '-prep_time', label: 'Longest Prep', direction: 'desc' },
  { value: 'cook_time', label: 'Quickest Cook', direction: 'asc' },
  { value: '-cook_time', label: 'Longest Cook', direction: 'desc' },
  { value: 'title', label: 'Alphabetical A-Z', direction: 'asc' },
  { value: '-title', label: 'Alphabetical Z-A', direction: 'desc' }
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