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
  templateUrl: './user-detail-dialog.component.html',
  styleUrls: ['./user-detail-dialog.component.scss']
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