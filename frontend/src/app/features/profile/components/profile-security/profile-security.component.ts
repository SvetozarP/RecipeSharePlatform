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
import { MatExpansionModule } from '@angular/material/expansion';

// Services
import { ProfileService } from '../../services/profile.service';

// Models
import { UserProfile, PasswordChangeRequest } from '../../models/user-profile.model';

@Component({
  selector: 'app-profile-security',
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
    MatDividerModule,
    MatExpansionModule
  ],
  templateUrl: './profile-security.component.html',
  styleUrls: ['./profile-security.component.scss']
})
export class ProfileSecurityComponent implements OnInit {
  @Input() userProfile: UserProfile | null = null;
  @Output() securityUpdated = new EventEmitter<UserProfile>();
  @Output() error = new EventEmitter<string>();

  passwordForm: FormGroup;
  isChangingPassword = false;
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    // Component initialization
  }

  private createPasswordForm(): FormGroup {
    return this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }



  private passwordMatchValidator(form: FormGroup): { [key: string]: any } | null {
    const newPassword = form.get('new_password');
    const confirmPassword = form.get('confirm_password');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }



  async onChangePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    try {
      this.isChangingPassword = true;
      
      const formValue = this.passwordForm.value;
      const passwordData: PasswordChangeRequest = {
        current_password: formValue.current_password,
        new_password: formValue.new_password,
        confirm_password: formValue.confirm_password
      };

      await this.profileService.changePassword(passwordData);
      
      this.passwordForm.reset();
      this.snackBar.open('Password changed successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Failed to change password:', error);
      this.error.emit('Failed to change password. Please check your current password and try again.');
    } finally {
      this.isChangingPassword = false;
    }
  }



  async onExportData(): Promise<void> {
    try {
      const data = await this.profileService.exportUserData();
      
      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'user-data-export.json';
      link.click();
      window.URL.revokeObjectURL(url);
      
      this.snackBar.open('Data exported successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Failed to export data:', error);
      this.error.emit('Failed to export data. Please try again.');
    }
  }

  onDeactivateAccount(): void {
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to deactivate your account? This action can be undone by logging in again.');
    if (confirmed) {
      this.profileService.deactivateAccount().then(() => {
        this.snackBar.open('Account deactivated successfully!', 'Close', { duration: 3000 });
        // Redirect to logout
        window.location.href = '/auth/logout';
      }).catch(error => {
        console.error('Failed to deactivate account:', error);
        this.error.emit('Failed to deactivate account. Please try again.');
      });
    }
  }

  onDeleteAccount(): void {
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.');
    if (confirmed) {
      this.profileService.deleteAccount().then(() => {
        this.snackBar.open('Account deleted successfully!', 'Close', { duration: 3000 });
        // Redirect to logout
        window.location.href = '/auth/logout';
      }).catch(error => {
        console.error('Failed to delete account:', error);
        this.error.emit('Failed to delete account. Please try again.');
      });
    }
  }



  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getPasswordError(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.replace('_', ' ')} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName.replace('_', ' ')} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    
    if (this.passwordForm.errors?.['passwordMismatch'] && fieldName === 'confirm_password') {
      return 'Passwords do not match';
    }
    
    return '';
  }

  getPasswordStrength(password: string): { strength: string; color: string; percentage: number } {
    if (!password) {
      return { strength: 'Weak', color: 'red', percentage: 0 };
    }

    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;

    if (score <= 25) {
      return { strength: 'Weak', color: 'red', percentage: score };
    } else if (score <= 50) {
      return { strength: 'Fair', color: 'orange', percentage: score };
    } else if (score <= 75) {
      return { strength: 'Good', color: 'yellow', percentage: score };
    } else {
      return { strength: 'Strong', color: 'green', percentage: score };
    }
  }


} 