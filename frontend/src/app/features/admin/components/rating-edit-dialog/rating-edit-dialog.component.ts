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
  templateUrl: './rating-edit-dialog.component.html',
  styleUrls: ['./rating-edit-dialog.component.scss']
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