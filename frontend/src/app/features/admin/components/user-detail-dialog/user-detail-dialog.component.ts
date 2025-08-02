import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../services/admin.service';
import { AdminUser } from '../../models/admin.models';

interface DialogData {
  user: AdminUser;
  mode: 'view' | 'edit';
}

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="user-detail-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ data.mode === 'view' ? 'visibility' : 'edit' }}</mat-icon>
          {{ data.mode === 'view' ? 'User Details' : 'Edit User' }}
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Saving changes...</p>
        </div>

        <!-- User Details Form -->
        <div *ngIf="!loading">
          <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <!-- Basic Information -->
              <div class="form-section">
                <h3>Basic Information</h3>
                
                <mat-form-field appearance="fill">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="first_name" [readonly]="data.mode === 'view'">
                  <mat-error *ngIf="userForm.get('first_name')?.hasError('required')">
                    First name is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="last_name" [readonly]="data.mode === 'view'">
                  <mat-error *ngIf="userForm.get('last_name')?.hasError('required')">
                    Last name is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Username</mat-label>
                  <input matInput formControlName="username" [readonly]="data.mode === 'view'">
                  <mat-error *ngIf="userForm.get('username')?.hasError('required')">
                    Username is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email" [readonly]="data.mode === 'view'">
                  <mat-error *ngIf="userForm.get('email')?.hasError('required')">
                    Email is required
                  </mat-error>
                  <mat-error *ngIf="userForm.get('email')?.hasError('email')">
                    Please enter a valid email
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Account Status -->
              <div class="form-section">
                <h3>Account Status</h3>
                
                <div class="status-controls" [class.readonly]="data.mode === 'view'">
                  <mat-checkbox formControlName="is_active" [disabled]="data.mode === 'view'">
                    Active Account
                  </mat-checkbox>
                  
                  <mat-checkbox formControlName="is_staff" [disabled]="data.mode === 'view'">
                    Staff Member
                  </mat-checkbox>
                  
                  <mat-checkbox formControlName="is_superuser" [disabled]="data.mode === 'view'">
                    Superuser
                  </mat-checkbox>
                  
                  <mat-checkbox formControlName="is_email_verified" [disabled]="data.mode === 'view'">
                    Email Verified
                  </mat-checkbox>
                </div>

                <!-- Current Status Display -->
                <div class="status-display">
                  <h4>Current Status</h4>
                  <mat-chip-set>
                    <mat-chip *ngIf="userForm.get('is_active')?.value" color="primary" variant="outlined">
                      Active
                    </mat-chip>
                    <mat-chip *ngIf="!userForm.get('is_active')?.value" color="warn" variant="outlined">
                      Inactive
                    </mat-chip>
                    <mat-chip *ngIf="userForm.get('is_staff')?.value" color="accent" variant="outlined">
                      Staff
                    </mat-chip>
                    <mat-chip *ngIf="userForm.get('is_superuser')?.value" color="warn">
                      Superuser
                    </mat-chip>
                    <mat-chip *ngIf="userForm.get('is_email_verified')?.value" color="primary">
                      Verified
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>

              <!-- Account Information -->
              <div class="form-section">
                <h3>Account Information</h3>
                
                <div class="info-item">
                  <label>Date Joined:</label>
                  <span>{{ data.user.date_joined | date:'medium' }}</span>
                </div>
                
                <div class="info-item">
                  <label>Last Login:</label>
                  <span>{{ data.user.last_login ? (data.user.last_login | date:'medium') : 'Never' }}</span>
                </div>
                
                <div class="info-item">
                  <label>Total Recipes:</label>
                  <span>{{ data.user.statistics?.total_recipes || 0 }}</span>
                </div>
                
                <div class="info-item">
                  <label>Total Favorites:</label>
                  <span>{{ data.user.statistics?.total_favorites || 0 }}</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button 
          *ngIf="data.mode === 'edit'"
          mat-raised-button 
          color="primary" 
          (click)="onSubmit()"
          [disabled]="userForm.invalid || loading">
          <mat-icon>save</mat-icon>
          Save Changes
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .user-detail-dialog {
      min-width: 500px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      margin: 0;
    }

    .dialog-header mat-icon {
      margin-right: 8px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .form-grid {
      display: grid;
      gap: 24px;
    }

    .form-section {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
    }

    .form-section h3 {
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 1.1rem;
    }

    .form-section mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .status-controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .status-controls.readonly mat-checkbox {
      pointer-events: none;
      opacity: 0.7;
    }

    .status-display h4 {
      margin: 0 0 8px 0;
      font-size: 0.9rem;
      color: #666;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item label {
      font-weight: 500;
      color: #333;
    }

    .info-item span {
      color: #666;
    }

    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    mat-chip {
      font-size: 0.7rem;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin: 0;
    }

    @media (max-width: 768px) {
      .user-detail-dialog {
        min-width: auto;
        width: 100%;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserDetailDialogComponent implements OnInit {
  userForm: FormGroup;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<UserDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private formBuilder: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      is_active: [false],
      is_staff: [false],
      is_superuser: [false],
      is_email_verified: [false]
    });
  }

  ngOnInit(): void {
    this.populateForm();
  }



  private populateForm(): void {
    const user = this.data.user;
    this.userForm.patchValue({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      email: user.email || '',
      is_active: user.is_active || false,
      is_staff: user.is_staff || false,
      is_superuser: user.is_superuser || false,
      is_email_verified: user.is_email_verified || false
    });

    if (this.data.mode === 'view') {
      this.userForm.disable();
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid || this.data.mode === 'view') {
      return;
    }

    this.loading = true;
    const updatedUser = {
      ...this.data.user,
      ...this.userForm.value
    };

    this.adminService.updateUser(this.data.user.id, updatedUser).subscribe({
      next: (result) => {
        this.loading = false;
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;
        console.error('Failed to update user:', error);
        this.snackBar.open('Failed to update user', 'Close', {
          duration: 5000
        });
      }
    });
  }
} 