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
import { MatDividerModule } from '@angular/material/divider';
import { AdminService } from '../../services/admin.service';
import { AdminRating } from '../../models/admin.models';

interface DialogData {
  rating: AdminRating;
}

@Component({
  selector: 'app-rating-edit-dialog',
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
    MatDividerModule,
  ],
  template: `
    <div class="rating-edit-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>edit</mat-icon>
          Edit Rating
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

        <!-- Rating Edit Form -->
        <div *ngIf="!loading">
          <form [formGroup]="ratingForm" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <!-- Rating Information -->
              <div class="form-section">
                <h3>Rating Information</h3>
                
                <mat-form-field appearance="fill">
                  <mat-label>Rating</mat-label>
                  <mat-select formControlName="rating">
                    <mat-option value="1">1 Star</mat-option>
                    <mat-option value="2">2 Stars</mat-option>
                    <mat-option value="3">3 Stars</mat-option>
                    <mat-option value="4">4 Stars</mat-option>
                    <mat-option value="5">5 Stars</mat-option>
                  </mat-select>
                  <mat-error *ngIf="ratingForm.get('rating')?.hasError('required')">
                    Rating is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Review</mat-label>
                  <textarea matInput formControlName="review" rows="4" placeholder="Enter review text (optional)"></textarea>
                </mat-form-field>

                <div class="checkbox-item">
                  <mat-checkbox formControlName="is_verified_purchase">
                    Verified Purchase
                  </mat-checkbox>
                </div>
              </div>

              <!-- Moderation Status -->
              <div class="form-section">
                <h3>Moderation Status</h3>
                
                <mat-form-field appearance="fill">
                  <mat-label>Status</mat-label>
                  <mat-select formControlName="moderation_status">
                    <mat-option value="pending">Pending</mat-option>
                    <mat-option value="approved">Approved</mat-option>
                    <mat-option value="rejected">Rejected</mat-option>
                    <mat-option value="flagged">Flagged</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Moderation Notes</mat-label>
                  <textarea matInput formControlName="moderation_notes" rows="3" 
                           placeholder="Add moderation notes (optional)"></textarea>
                </mat-form-field>
              </div>

              <!-- Current Information (Read-only) -->
              <div class="form-section">
                <h3>Current Information</h3>
                
                <div class="info-item">
                  <label>Recipe:</label>
                  <span>{{ data.rating.recipe.title }}</span>
                </div>
                
                <div class="info-item">
                  <label>User:</label>
                  <span>{{ data.rating.user.username }} ({{ data.rating.user.email }})</span>
                </div>
                
                <div class="info-item">
                  <label>Created:</label>
                  <span>{{ data.rating.created_at | date:'medium' }}</span>
                </div>
                
                <div class="info-item">
                  <label>Helpful Votes:</label>
                  <span>{{ data.rating.helpful_count }}</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onSubmit()"
          [disabled]="ratingForm.invalid || loading">
          <mat-icon>save</mat-icon>
          Save Changes
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .rating-edit-dialog {
      min-width: 500px;
      max-width: 700px;
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

    .checkbox-item {
      margin-bottom: 16px;
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

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin: 0;
    }

    @media (max-width: 768px) {
      .rating-edit-dialog {
        min-width: auto;
        width: 100%;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RatingEditDialogComponent implements OnInit {
  ratingForm: FormGroup;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<RatingEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private formBuilder: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {
    this.ratingForm = this.formBuilder.group({
      rating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      review: [''],
      is_verified_purchase: [false],
      moderation_status: ['', Validators.required],
      moderation_notes: ['']
    });
  }

  ngOnInit(): void {
    this.populateForm();
  }

  private populateForm(): void {
    const rating = this.data.rating;
    this.ratingForm.patchValue({
      rating: rating.rating || 1,
      review: rating.review || '',
      is_verified_purchase: rating.is_verified_purchase || false,
      moderation_status: rating.moderation_status || 'pending',
      moderation_notes: rating.moderation_notes || ''
    });
  }

  onSubmit(): void {
    if (this.ratingForm.invalid) {
      return;
    }

    this.loading = true;
    const updatedRating = {
      ...this.ratingForm.value
    };

    this.adminService.updateRating(this.data.rating.id, updatedRating).subscribe({
      next: (result) => {
        this.loading = false;
        this.snackBar.open('Rating updated successfully', 'Close', {
          duration: 3000
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;
        console.error('Failed to update rating:', error);
        this.snackBar.open('Failed to update rating', 'Close', {
          duration: 5000
        });
      }
    });
  }
} 