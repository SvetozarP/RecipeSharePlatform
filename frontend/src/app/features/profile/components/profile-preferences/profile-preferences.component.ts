import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';

// Services
import { ProfileService } from '../../services/profile.service';

// Models
import { UserProfile, PreferencesUpdateRequest } from '../../models/user-profile.model';

@Component({
  selector: 'app-profile-preferences',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    MatExpansionModule
  ],
  templateUrl: './profile-preferences.component.html',
  styleUrls: ['./profile-preferences.component.scss']
})
export class ProfilePreferencesComponent implements OnInit {
  @Input() userProfile: UserProfile | null = null;
  @Output() preferencesUpdated = new EventEmitter<UserProfile>();
  @Output() error = new EventEmitter<string>();

  preferencesForm: FormGroup;
  isEditing = false;
  isSaving = false;
  newDietaryRestriction = '';
  newFavoriteCuisine = '';

  // Options for dropdowns
  unitOptions = [
    { value: 'metric', label: 'Metric (kg, g, l, ml)' },
    { value: 'imperial', label: 'Imperial (lb, oz, cups)' }
  ];

  skillLevelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'friends', label: 'Friends Only' }
  ];

  languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' }
  ];

  timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' }
  ];

  timeFormatOptions = [
    { value: '12h', label: '12-hour (AM/PM)' },
    { value: '24h', label: '24-hour' }
  ];

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {
    this.preferencesForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadPreferencesData();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Display preferences
      display_name: ['', [Validators.required, Validators.maxLength(100)]],
      show_email: [false],
      show_location: [false],
      show_social_links: [false],
      
      // Notification preferences
      email_notifications: this.fb.group({
        new_followers: [false],
        recipe_comments: [false],
        recipe_ratings: [false],
        recipe_favorites: [false],
        weekly_digest: [false],
        security_alerts: [true]
      }),
      
      push_notifications: this.fb.group({
        new_followers: [false],
        recipe_comments: [false],
        recipe_ratings: [false],
        recipe_favorites: [false],
        weekly_digest: [false],
        security_alerts: [true]
      }),
      
      // Recipe preferences
      default_servings: [4, [Validators.required, Validators.min(1), Validators.max(20)]],
      preferred_units: ['metric', [Validators.required]],
      dietary_restrictions: [[]],
      favorite_cuisines: [[]],
      cooking_skill_level: ['beginner', [Validators.required]],
      
      // Privacy preferences
      profile_visibility: ['public', [Validators.required]],
      recipe_visibility: ['public', [Validators.required]],
      allow_comments: [true],
      allow_ratings: [true],
      show_activity: [true],
      
      // Language and region
      language: ['en', [Validators.required]],
      timezone: ['UTC', [Validators.required]],
      date_format: ['MM/DD/YYYY', [Validators.required]],
      time_format: ['12h', [Validators.required]]
    });
  }

  private loadPreferencesData(): void {
    if (this.userProfile?.preferences) {
      const prefs = this.userProfile.preferences;
      this.preferencesForm.patchValue({
        display_name: prefs.display_name || '',
        show_email: prefs.show_email || false,
        show_location: prefs.show_location || false,
        show_social_links: prefs.show_social_links || false,
        email_notifications: {
          new_followers: prefs.email_notifications.new_followers || false,
          recipe_comments: prefs.email_notifications.recipe_comments || false,
          recipe_ratings: prefs.email_notifications.recipe_ratings || false,
          recipe_favorites: prefs.email_notifications.recipe_favorites || false,
          weekly_digest: prefs.email_notifications.weekly_digest || false,
          security_alerts: prefs.email_notifications.security_alerts || true
        },
        push_notifications: {
          new_followers: prefs.push_notifications.new_followers || false,
          recipe_comments: prefs.push_notifications.recipe_comments || false,
          recipe_ratings: prefs.push_notifications.recipe_ratings || false,
          recipe_favorites: prefs.push_notifications.recipe_favorites || false,
          weekly_digest: prefs.push_notifications.weekly_digest || false,
          security_alerts: prefs.push_notifications.security_alerts || true
        },
        default_servings: prefs.default_servings || 4,
        preferred_units: prefs.preferred_units || 'metric',
        dietary_restrictions: prefs.dietary_restrictions || [],
        favorite_cuisines: prefs.favorite_cuisines || [],
        cooking_skill_level: prefs.cooking_skill_level || 'beginner',
        profile_visibility: prefs.profile_visibility || 'public',
        recipe_visibility: prefs.recipe_visibility || 'public',
        allow_comments: prefs.allow_comments || true,
        allow_ratings: prefs.allow_ratings || true,
        show_activity: prefs.show_activity || true,
        language: prefs.language || 'en',
        timezone: prefs.timezone || 'UTC',
        date_format: prefs.date_format || 'MM/DD/YYYY',
        time_format: prefs.time_format || '12h'
      });
    }
  }

  onEdit(): void {
    this.isEditing = true;
  }

  onCancel(): void {
    this.isEditing = false;
    this.loadPreferencesData();
  }

  async onSave(): Promise<void> {
    if (this.preferencesForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    try {
      this.isSaving = true;
      
      const formValue = this.preferencesForm.value;
      const updateData: PreferencesUpdateRequest = {
        display_name: formValue.display_name,
        show_email: formValue.show_email,
        show_location: formValue.show_location,
        show_social_links: formValue.show_social_links,
        email_notifications: formValue.email_notifications,
        push_notifications: formValue.push_notifications,
        default_servings: formValue.default_servings,
        preferred_units: formValue.preferred_units,
        dietary_restrictions: formValue.dietary_restrictions,
        favorite_cuisines: formValue.favorite_cuisines,
        cooking_skill_level: formValue.cooking_skill_level,
        profile_visibility: formValue.profile_visibility,
        recipe_visibility: formValue.recipe_visibility,
        allow_comments: formValue.allow_comments,
        allow_ratings: formValue.allow_ratings,
        show_activity: formValue.show_activity,
        language: formValue.language,
        timezone: formValue.timezone,
        date_format: formValue.date_format,
        time_format: formValue.time_format
      };

      const updatedProfile = await this.profileService.updatePreferences(updateData);
      
      this.preferencesUpdated.emit(updatedProfile);
      this.isEditing = false;
      
      this.snackBar.open('Preferences updated successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      this.error.emit('Failed to update preferences. Please try again.');
    } finally {
      this.isSaving = false;
    }
  }

  addDietaryRestriction(): void {
    if (this.newDietaryRestriction.trim()) {
      const currentRestrictions = this.preferencesForm.get('dietary_restrictions')?.value || [];
      if (!currentRestrictions.includes(this.newDietaryRestriction.trim())) {
        currentRestrictions.push(this.newDietaryRestriction.trim());
        this.preferencesForm.patchValue({ dietary_restrictions: currentRestrictions });
      }
      this.newDietaryRestriction = '';
    }
  }

  removeDietaryRestriction(restriction: string): void {
    const currentRestrictions = this.preferencesForm.get('dietary_restrictions')?.value || [];
    const updatedRestrictions = currentRestrictions.filter((r: string) => r !== restriction);
    this.preferencesForm.patchValue({ dietary_restrictions: updatedRestrictions });
  }

  addFavoriteCuisine(): void {
    if (this.newFavoriteCuisine.trim()) {
      const currentCuisines = this.preferencesForm.get('favorite_cuisines')?.value || [];
      if (!currentCuisines.includes(this.newFavoriteCuisine.trim())) {
        currentCuisines.push(this.newFavoriteCuisine.trim());
        this.preferencesForm.patchValue({ favorite_cuisines: currentCuisines });
      }
      this.newFavoriteCuisine = '';
    }
  }

  removeFavoriteCuisine(cuisine: string): void {
    const currentCuisines = this.preferencesForm.get('favorite_cuisines')?.value || [];
    const updatedCuisines = currentCuisines.filter((c: string) => c !== cuisine);
    this.preferencesForm.patchValue({ favorite_cuisines: updatedCuisines });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.preferencesForm.controls).forEach(key => {
      const control = this.preferencesForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(nestedKey => {
          control.get(nestedKey)?.markAsTouched();
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.preferencesForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.replace('_', ' ')} is required`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName.replace('_', ' ')} must be less than ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${fieldName.replace('_', ' ')} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${fieldName.replace('_', ' ')} must be at most ${field.errors['max'].max}`;
      }
    }
    return '';
  }

  getNestedFieldError(groupName: string, fieldName: string): string {
    const field = this.preferencesForm.get(`${groupName}.${fieldName}`);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.replace('_', ' ')} is required`;
      }
    }
    return '';
  }
} 