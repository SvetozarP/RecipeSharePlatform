export interface UserProfile {
  id: string;
  user: User;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  social_links: SocialLinks;
  preferences: UserPreferences;
  security_settings: SecuritySettings;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
  last_login: string;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  pinterest?: string;
  linkedin?: string;
}

export interface UserPreferences {
  // Display preferences
  display_name: string;
  show_email: boolean;
  show_location: boolean;
  show_social_links: boolean;
  
  // Notification preferences
  email_notifications: EmailNotifications;
  push_notifications: PushNotifications;
  
  // Recipe preferences
  default_servings: number;
  preferred_units: 'metric' | 'imperial';
  dietary_restrictions: string[];
  favorite_cuisines: string[];
  cooking_skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  
  // Privacy preferences
  profile_visibility: 'public' | 'private' | 'friends';
  recipe_visibility: 'public' | 'private' | 'friends';
  allow_comments: boolean;
  allow_ratings: boolean;
  show_activity: boolean;
  
  // Language and region
  language: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
}

export interface EmailNotifications {
  new_followers: boolean;
  recipe_comments: boolean;
  recipe_ratings: boolean;
  recipe_favorites: boolean;
  weekly_digest: boolean;
  security_alerts: boolean;
}

export interface PushNotifications {
  new_followers: boolean;
  recipe_comments: boolean;
  recipe_ratings: boolean;
  recipe_favorites: boolean;
  weekly_digest: boolean;
  security_alerts: boolean;
}

export interface SecuritySettings {
  password_last_changed: string;
  account_locked: boolean;
  failed_login_attempts: number;
  last_failed_login?: string;
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
  social_links?: Partial<SocialLinks>;
}

export interface PreferencesUpdateRequest {
  display_name?: string;
  show_email?: boolean;
  show_location?: boolean;
  show_social_links?: boolean;
  email_notifications?: Partial<EmailNotifications>;
  push_notifications?: Partial<PushNotifications>;
  default_servings?: number;
  preferred_units?: 'metric' | 'imperial';
  dietary_restrictions?: string[];
  favorite_cuisines?: string[];
  cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  profile_visibility?: 'public' | 'private' | 'friends';
  recipe_visibility?: 'public' | 'private' | 'friends';
  allow_comments?: boolean;
  allow_ratings?: boolean;
  show_activity?: boolean;
  language?: string;
  timezone?: string;
  date_format?: string;
  time_format?: '12h' | '24h';
}

export interface SecurityUpdateRequest {
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

 