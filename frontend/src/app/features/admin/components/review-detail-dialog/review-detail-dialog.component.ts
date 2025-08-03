import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

interface DialogData {
  review: string;
  rating: number;
  user: {
    username: string;
    email: string;
  };
  recipe: {
    title: string;
  };
  created_at: string;
}

@Component({
  selector: 'app-review-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './review-detail-dialog.component.html',
  styleUrls: ['./review-detail-dialog.component.scss']
})
export class ReviewDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ReviewDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
} 