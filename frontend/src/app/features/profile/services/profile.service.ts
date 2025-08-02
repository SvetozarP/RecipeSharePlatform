import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  UserProfile,
  ProfileUpdateRequest,
  PreferencesUpdateRequest,
  SecurityUpdateRequest,
  PasswordChangeRequest
} from '../models/user-profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  public profile$ = this.profileSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  // Profile Management
  async getUserProfile(): Promise<UserProfile> {
    try {
      const backendProfile = await this.apiService.get<any>('/users/profile/').toPromise();
      if (backendProfile) {
        // Transform backend response to frontend expected structure
        const profile: UserProfile = this.transformBackendProfile(backendProfile);
        this.profileSubject.next(profile);
        return profile;
      } else {
        throw new Error('Failed to load user profile');
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw error;
    }
  }

  private transformBackendProfile(backendProfile: any): UserProfile {
    // Get current user from auth service for additional data
    const currentUser = this.authService.getCurrentUser();
    
    return {
      id: currentUser?.id || '1',
      user: {
        id: currentUser?.id || '1',
        username: currentUser?.username || 'user',
        email: currentUser?.email || 'user@example.com',
        first_name: backendProfile.first_name || '',
        last_name: backendProfile.last_name || '',
        is_active: true,
        date_joined: new Date().toISOString(),
        last_login: new Date().toISOString()
      },
      avatar_url: '/assets/images/default-avatar.svg',
      bio: backendProfile.bio || '',
      location: backendProfile.location || '',
      website: backendProfile.website || '',
      preferences: {
        display_name: `${backendProfile.first_name || ''} ${backendProfile.last_name || ''}`.trim() || 'User',
        show_email: backendProfile.show_email || false,
        show_location: backendProfile.show_location || false,
        email_notifications: {
          new_followers: true,
          recipe_comments: true,
          recipe_ratings: true,
          recipe_favorites: true,
          weekly_digest: true,
          security_alerts: true
        },
        push_notifications: {
          new_followers: true,
          recipe_comments: true,
          recipe_ratings: true,
          recipe_favorites: true,
          weekly_digest: true,
          security_alerts: true
        },
        default_servings: 4,
        preferred_units: 'metric',
        dietary_restrictions: [],
        favorite_cuisines: [],
        cooking_skill_level: 'intermediate',
        profile_visibility: backendProfile.is_public_profile ? 'public' : 'private',
        recipe_visibility: 'public',
        allow_comments: true,
        allow_ratings: true,
        show_activity: true,
        language: backendProfile.language || 'en',
        timezone: backendProfile.timezone || 'UTC',
        date_format: 'MM/DD/YYYY',
        time_format: '12h'
      },
      security_settings: {
        password_last_changed: new Date().toISOString(),
        account_locked: false,
        failed_login_attempts: 0
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async updateProfile(updateData: ProfileUpdateRequest): Promise<UserProfile> {
    try {
      const backendProfile = await this.apiService.put<any>('/users/profile/', updateData).toPromise();
      if (backendProfile) {
        // Transform backend response to frontend expected structure
        const updatedProfile: UserProfile = this.transformBackendProfile(backendProfile);
        this.profileSubject.next(updatedProfile);
        return updatedProfile;
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  // Preferences Management
  async updatePreferences(preferences: PreferencesUpdateRequest): Promise<UserProfile> {
    try {
      const backendProfile = await this.apiService.put<any>('/users/profile/preferences/', preferences).toPromise();
      if (backendProfile) {
        // Transform backend response to frontend expected structure
        const updatedProfile: UserProfile = this.transformBackendProfile(backendProfile);
        this.profileSubject.next(updatedProfile);
        return updatedProfile;
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  async getPreferences(): Promise<UserProfile['preferences']> {
    try {
      const profile = await this.getUserProfile();
      return profile.preferences;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      throw error;
    }
  }

  async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    try {
      await this.apiService.post<void>('/auth/password/change/', passwordData).toPromise();
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }



  // Utility Methods
  getCurrentProfile(): UserProfile | null {
    return this.profileSubject.value;
  }

  refreshProfile(): void {
    this.getUserProfile().catch(error => {
      console.error('Failed to refresh profile:', error);
    });
  }

  // Validation Methods
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }


} 