export interface AdminUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_email_verified: boolean;
  date_joined: string;
  last_login?: string;
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
    phone?: string;
    birth_date?: string;
  };
  statistics?: {
    total_recipes: number;
    published_recipes: number;
    total_ratings: number;
    total_favorites: number;
  };
}

export interface AdminRecipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  author: {
    id: string;
    username: string;
    email: string;
  };
  is_published: boolean;
  created_at: string;
  updated_at: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  rating_stats: {
    average_rating: number;
    total_ratings: number;
  };
  view_count: number;
  favorite_count: number;
  moderation_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'flagged';
  moderation_notes?: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parent?: number;
  children?: AdminCategory[];
  is_active: boolean;
  ordering: number;
  recipe_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminRating {
  id: string;
  recipe: {
    id: string;
    title: string;
    slug: string;
  };
  user: {
    id: string;
    username: string;
    email: string;
  };
  rating: number;
  review?: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlatformStatistics {
  users: {
    total: number;
    active: number;
    new_this_month: number;
    new_this_week: number;
    verified: number;
    staff: number;
  };
  recipes: {
    total: number;
    published: number;
    pending_moderation: number;
    rejected: number;
    new_this_month: number;
    new_this_week: number;
  };

  ratings: {
    total: number;
    average_rating: number;
    pending_moderation: number;
    flagged: number;
  };
  engagement: {
    total_views: number;
    total_favorites: number;
    average_views_per_recipe: number;
    average_favorites_per_recipe: number;
  };
  activity: {
    recipes_created_today: number;
    ratings_submitted_today: number;
    users_registered_today: number;
    active_users_this_week: number;
  };
}

export interface AnalyticsData {
  user_growth: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }>;
  };
  recipe_activity: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }>;
  };
  category_distribution: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
    }>;
  };
  rating_distribution: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
    }>;
  };
  top_recipes: Array<{
    id: string;
    title: string;
    views: number;
    favorites: number;
    average_rating: number;
  }>;
  top_categories: Array<{
    id: number;
    name: string;
    recipe_count: number;
    average_rating: number;
  }>;
  top_users: Array<{
    id: string;
    username: string;
    recipe_count: number;
    total_views: number;
    average_rating: number;
  }>;
}

export interface SystemSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  max_upload_size: number;
  allowed_image_formats: string[];
  moderation_enabled: boolean;
  auto_approve_recipes: boolean;
  auto_approve_ratings: boolean;
  registration_enabled: boolean;
  email_verification_required: boolean;
  max_recipes_per_user: number;
  max_images_per_recipe: number;
  maintenance_mode: boolean;
  maintenance_message: string;
}

export interface BulkOperation {
  id: string;
  type: 'delete' | 'approve' | 'reject' | 'ban' | 'activate' | 'deactivate';
  target_type: 'users' | 'recipes' | 'ratings' | 'categories';
  target_ids: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  completed: number;
  failed: number;
  errors: string[];
  created_at: string;
  completed_at?: string;
  created_by: {
    id: string;
    username: string;
  };
}

export interface ModerationQueue {
  recipes: {
    pending: number;
    flagged: number;
    total: number;
  };
  ratings: {
    pending: number;
    flagged: number;
    total: number;
  };
  users: {
    pending_verification: number;
    flagged: number;
    total: number;
  };
}

export interface AdminFilters {
  users?: {
    search?: string;
    status?: 'active' | 'inactive' | 'staff' | 'superuser';
    date_joined_after?: string;
    date_joined_before?: string;
  };
  recipes?: {
    search?: string;
    status?: 'published' | 'draft' | 'pending' | 'rejected' | 'flagged';
    author?: string;
    category?: number;
    date_created_after?: string;
    date_created_before?: string;
  };
  ratings?: {
    search?: string;
    rating?: number;
    date_created_after?: string;
    date_created_before?: string;
  };
  categories?: {
    search?: string;
    status?: 'active' | 'inactive';
    parent?: number;
  };
}

export interface AdminPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface AdminListResponse<T> {
  results: T[];
  pagination: AdminPagination;
  filters?: AdminFilters;
}

export interface RecentActivity {
  id: string;
  type: 'user_registered' | 'recipe_created' | 'recipe_approved' | 'recipe_rejected' | 'rating_submitted' | 'user_activated' | 'user_deactivated' | 'recipe_flagged' | 'rating_flagged';
  icon: string;
  message: string;
  timestamp: string;
  time_ago: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  recipe?: {
    id: string;
    title: string;
    slug: string;
  };
  rating?: {
    id: string;
    rating: number;
    review?: string;
  };
} 