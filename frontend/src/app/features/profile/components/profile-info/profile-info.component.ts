import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { ProfileService } from '../../services/profile.service';

// Models
import { UserProfile, ProfileUpdateRequest } from '../../models/user-profile.model';

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss']
})
export class ProfileInfoComponent implements OnInit {
  @Input() userProfile: UserProfile | null = null;
  @Output() profileUpdated = new EventEmitter<UserProfile>();
  @Output() error = new EventEmitter<string>();

  profileForm: FormGroup;
  isEditing = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      first_name: ['', [Validators.required, Validators.maxLength(50)]],
      last_name: ['', [Validators.required, Validators.maxLength(50)]],
      bio: ['', [Validators.maxLength(500)]],
      location: ['', [Validators.maxLength(100)]],
      website: ['', [Validators.pattern('https?://.+')]]
    });
  }

  private loadProfileData(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        first_name: this.userProfile.user.first_name || '',
        last_name: this.userProfile.user.last_name || '',
        bio: this.userProfile.bio || '',
        location: this.userProfile.location || '',
        website: this.userProfile.website || ''
      });
    }
  }

  onEdit(): void {
    this.isEditing = true;
  }

  onCancel(): void {
    this.isEditing = false;
    this.loadProfileData();
  }

  async onSave(): Promise<void> {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    try {
      this.isSaving = true;
      
      const formValue = this.profileForm.value;
      const updateData: ProfileUpdateRequest = {
        first_name: formValue.first_name,
        last_name: formValue.last_name,
        bio: formValue.bio,
        location: formValue.location,
        website: formValue.website
      };

      const updatedProfile = await this.profileService.updateProfile(updateData);
      
      this.profileUpdated.emit(updatedProfile);
      this.isEditing = false;
      
      this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Failed to update profile:', error);
      this.error.emit('Failed to update profile. Please try again.');
    } finally {
      this.isSaving = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
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
    const field = this.profileForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.replace('_', ' ')} is required`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName.replace('_', ' ')} must be less than ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return `Please enter a valid ${fieldName.replace('_', ' ')} URL`;
      }
    }
    return '';
  }



  getAvatarUrl(): string {
    if (this.userProfile?.avatar_url) {
      return this.userProfile.avatar_url;
    }
    return '/assets/images/default-avatar.svg';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/default-avatar.svg';
  }

  getDisplayName(): string {
    if (!this.userProfile) return '';
    
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
} 