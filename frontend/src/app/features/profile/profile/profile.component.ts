import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

// Services
import { ProfileService } from '../services/profile.service';
import { AuthService } from '../../../core/services/auth.service';

// Models
import { UserProfile, ProfileUpdateRequest, PreferencesUpdateRequest, SecurityUpdateRequest } from '../models/user-profile.model';

// Components
import { ProfileInfoComponent } from '../components/profile-info/profile-info.component';
import { ProfilePreferencesComponent } from '../components/profile-preferences/profile-preferences.component';
import { ProfileSecurityComponent } from '../components/profile-security/profile-security.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    ProfileInfoComponent,
    ProfilePreferencesComponent,
    ProfileSecurityComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  isLoading = true;
  selectedTabIndex = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    
    // Subscribe to profile updates
    this.profileService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(profile => {
        this.userProfile = profile;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadUserProfile(): Promise<void> {
    try {
      this.isLoading = true;
      await this.profileService.getUserProfile();
    } catch (error) {
      console.error('Failed to load user profile:', error);
      this.snackBar.open('Failed to load profile data', 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  onProfileUpdated(updatedProfile: UserProfile): void {
    this.userProfile = updatedProfile;
    this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
  }

  onPreferencesUpdated(updatedProfile: UserProfile): void {
    this.userProfile = updatedProfile;
    this.snackBar.open('Preferences updated successfully!', 'Close', { duration: 3000 });
  }

  onSecurityUpdated(updatedProfile: UserProfile): void {
    this.userProfile = updatedProfile;
    this.snackBar.open('Security settings updated successfully!', 'Close', { duration: 3000 });
  }

  onError(error: string): void {
    this.snackBar.open(error, 'Close', { duration: 3000 });
  }

  getDisplayName(): string {
    if (!this.userProfile) return '';
    
    const displayName = this.userProfile.preferences.display_name;
    if (displayName) return displayName;
    
    const firstName = this.userProfile.user.first_name;
    const lastName = this.userProfile.user.last_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else {
      return this.userProfile.user.username;
    }
  }

  getAvatarUrl(): string {
    if (!this.userProfile?.avatar_url) {
      return '/assets/images/default-avatar.png';
    }
    return this.userProfile.avatar_url;
  }

  getMemberSince(): string {
    if (!this.userProfile) return '';
    return new Date(this.userProfile.user.date_joined).toLocaleDateString();
  }

  getLastLogin(): string {
    if (!this.userProfile) return '';
    return new Date(this.userProfile.user.last_login).toLocaleDateString();
  }
} 