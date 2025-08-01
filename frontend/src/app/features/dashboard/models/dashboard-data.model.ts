import { Recipe } from '../../../shared/models/recipe.models';

export interface DashboardData {
  summary: DashboardSummary;
  recent_activity: Activity[];
  favorite_recipes: Recipe[];
  recommended_recipes: Recipe[];
  collections: Collection[];
  user_stats: UserStatistics;
}

export interface DashboardSummary {
  total_recipes: number;
  total_favorites: number;
  total_collections: number;
  recent_activity_count: number;
  new_recommendations: number;
}

export interface UserStatistics {
  total_recipes: number;
  published_recipes: number;
  draft_recipes: number;
  private_recipes: number;
  total_favorites: number;
  total_views: number;
  total_ratings: number;
  average_rating: number;
  total_comments: number;
  first_recipe_date: string;
  last_activity_date: string;
  most_used_category: string;
  preferred_difficulty: string;
}

export interface Activity {
  id: number;
  type: 'recipe_created' | 'recipe_published' | 'comment_added' | 'rating_given' | 'favorite_added' | 'collection_created';
  description: string;
  recipe?: Recipe;
  user?: any;
  created_at: string;
  metadata?: any;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  recipe_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  recipes?: Recipe[];
}



export interface RecipeStats {
  total_recipes: number;
  published_recipes: number;
  draft_recipes: number;
  private_recipes: number;
  total_views: number;
  total_ratings: number;
  average_rating: number;
  most_viewed_recipe: Recipe;
  highest_rated_recipe: Recipe;
}