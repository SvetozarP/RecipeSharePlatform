import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  UserProfile,
  ProfileUpdateRequest,
  PreferencesUpdateRequest,
  SecurityUpdateRequest,
  PasswordChangeRequest,
  AvatarUploadResponse
} from '../models/user-profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  public profile$ = this.profileSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // Profile Management
  async getUserProfile(): Promise<UserProfile> {
    try {
      const profile = await this.apiService.get<UserProfile>('/user/profile/').toPromise();
      if (profile) {
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

  async updateProfile(updateData: ProfileUpdateRequest): Promise<UserProfile> {
    try {
      const updatedProfile = await this.apiService.patch<UserProfile>('/user/profile/', updateData).toPromise();
      if (updatedProfile) {
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

  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await this.apiService.post<AvatarUploadResponse>('/user/profile/avatar/', formData).toPromise();
      
      if (response) {
        // Update the profile with new avatar URL
        const currentProfile = this.profileSubject.value;
        if (currentProfile) {
          const updatedProfile = { ...currentProfile, avatar_url: response.avatar_url };
          this.profileSubject.next(updatedProfile);
        }
        
        return response;
      } else {
        throw new Error('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  }

  // Preferences Management
  async updatePreferences(preferences: PreferencesUpdateRequest): Promise<UserProfile> {
    try {
      const updatedProfile = await this.apiService.patch<UserProfile>('/user/preferences/', preferences).toPromise();
      if (updatedProfile) {
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
      await this.apiService.post<void>('/user/change-password/', passwordData).toPromise();
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }



  // Account Management
  async deactivateAccount(): Promise<void> {
    try {
      await this.apiService.post<void>('/user/deactivate/', {}).toPromise();
    } catch (error) {
      console.error('Failed to deactivate account:', error);
      throw error;
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      await this.apiService.delete<void>('/user/delete/').toPromise();
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }

  async exportUserData(): Promise<Blob> {
    try {
      const response = await this.apiService.get<Blob>('/user/export/', { responseType: 'blob' }).toPromise();
      if (response) {
        return response;
      } else {
        throw new Error('Failed to export user data');
      }
    } catch (error) {
      console.error('Failed to export user data:', error);
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

  validateSocialLink(platform: string, url: string): boolean {
    if (!url) return true; // Empty URLs are allowed
    
    const patterns: { [key: string]: RegExp } = {
      facebook: /^https?:\/\/(www\.)?facebook\.com\/.+/,
      twitter: /^https?:\/\/(www\.)?twitter\.com\/.+/,
      instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/,
      youtube: /^https?:\/\/(www\.)?youtube\.com\/.+/,
      pinterest: /^https?:\/\/(www\.)?pinterest\.com\/.+/,
      linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.+/
    };
    
    const pattern = patterns[platform];
    return pattern ? pattern.test(url) : true;
  }
} 