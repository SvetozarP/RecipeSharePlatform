export interface UserProfile {
  id: string;
  user: User;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
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



export interface UserPreferences {
  // Backend-supported preferences
  email_notifications: boolean;
  public_profile: boolean;
  show_email: boolean;
  timezone: string;
  language: string;
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
}

export interface PreferencesUpdateRequest {
  email_notifications?: boolean;
  public_profile?: boolean;
  show_email?: boolean;
  timezone?: string;
  language?: string;
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

 