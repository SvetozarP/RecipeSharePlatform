import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

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


  // Options for dropdowns
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

  themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' }
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
      // Backend-supported preferences
      email_notifications: [true],
      public_profile: [true],
      show_email: [false],
      timezone: ['UTC'],
      language: ['en'],
      theme: ['light']
    });
  }

  private loadPreferencesData(): void {
    if (this.userProfile?.preferences) {
      const prefs = this.userProfile.preferences;
      this.preferencesForm.patchValue({
        email_notifications: prefs.email_notifications ?? true,
        public_profile: prefs.public_profile ?? true,
        show_email: prefs.show_email ?? false,
        timezone: prefs.timezone || 'UTC',
        language: prefs.language || 'en',
        theme: prefs.theme || 'light'
      });
      
      // Disable form when not in editing mode to prevent validation
      this.updateFormState();
    }
  }

  private updateFormState(): void {
    if (this.isEditing) {
      this.preferencesForm.enable();
    } else {
      this.preferencesForm.disable();
    }
  }

  onEdit(): void {
    this.isEditing = true;
    this.updateFormState();
  }

  onCancel(): void {
    this.isEditing = false;
    this.loadPreferencesData();
    this.updateFormState();
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
        email_notifications: formValue.email_notifications,
        public_profile: formValue.public_profile,
        show_email: formValue.show_email,
        timezone: formValue.timezone,
        language: formValue.language,
        theme: formValue.theme
      };

      const updatedProfile = await this.profileService.updatePreferences(updateData);
      
      this.preferencesUpdated.emit(updatedProfile);
      this.isEditing = false;
      this.updateFormState();
      
      this.snackBar.open('Preferences updated successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      this.error.emit('Failed to update preferences. Please try again.');
    } finally {
      this.isSaving = false;
    }
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
    // Only show errors when in editing mode
    if (!this.isEditing) {
      return '';
    }
    
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
    // Only show errors when in editing mode
    if (!this.isEditing) {
      return '';
    }
    
    const field = this.preferencesForm.get(`${groupName}.${fieldName}`);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.replace('_', ' ')} is required`;
      }
    }
    return '';
  }
} 