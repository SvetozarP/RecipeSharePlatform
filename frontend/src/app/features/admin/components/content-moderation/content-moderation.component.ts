import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { AdminService } from '../../services/admin.service';
import { AdminRating, AdminFilters } from '../../models/admin.models';
import { RatingDetailDialogComponent } from '../rating-detail-dialog/rating-detail-dialog.component';
import { RatingEditDialogComponent } from '../rating-edit-dialog/rating-edit-dialog.component';
import { ReviewDetailDialogComponent } from '../review-detail-dialog/review-detail-dialog.component';

@Component({
  selector: 'app-content-moderation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatExpansionModule
  ],
  templateUrl: './content-moderation.component.html',
  styleUrls: ['./content-moderation.component.scss']
})
export class ContentModerationComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;
  dataSource = new MatTableDataSource<AdminRating>();
  displayedColumns: string[] = ['recipe', 'user', 'rating', 'review', 'status', 'helpful_votes', 'actions'];
  filtersForm: FormGroup;

  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.filtersForm = this.formBuilder.group({
      search: [''],
      rating: [''],
      date_created_after: [''],
      date_created_before: ['']
    });
  }

  ngOnInit(): void {
    // Load ratings after view init to ensure paginator is available
  }

  ngAfterViewInit(): void {
    // Don't connect dataSource.paginator to avoid conflicts with server-side pagination
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    
    // Subscribe to pagination events first
    if (this.paginator) {
      this.paginator.page.subscribe((event) => {
        this.loadRatings();
      });
    }
    
    // Load initial data after setting up event listeners
    this.loadRatings();
  }

  private loadRatings(): void {
    this.loading = true;
    
    const page = (this.paginator?.pageIndex || 0) + 1;
    const pageSize = this.paginator?.pageSize || 25;
    const filters = this.getFiltersFromForm();

    this.adminService.getRatings(page, pageSize, filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.results || [];
        
        // Set paginator length with a small delay to ensure paginator is fully initialized
        setTimeout(() => {
          if (this.paginator && response.count !== undefined) {
            this.paginator.length = response.count;
          } else {
            // Try again after a longer delay if paginator is still not available
            setTimeout(() => {
              if (this.paginator && response.count !== undefined) {
                this.paginator.length = response.count;
              }
            }, 100);
          }
        }, 50);
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load ratings:', error);
        this.snackBar.open('Failed to load ratings', 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  private getFiltersFromForm(): AdminFilters['ratings'] {
    const formValue = this.filtersForm?.value || {};
    return {
      search: formValue.search || undefined,
      rating: formValue.rating || undefined,
      date_created_after: formValue.date_created_after ? formValue.date_created_after.toISOString() : undefined,
      date_created_before: formValue.date_created_before ? formValue.date_created_before.toISOString() : undefined
    };
  }

  applyFilters(): void {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadRatings();
  }

  clearFilters(): void {
    this.filtersForm?.reset();
    this.applyFilters();
  }

  // Rating actions
  viewRating(rating: AdminRating): void {
    const dialogRef = this.dialog.open(RatingDetailDialogComponent, {
      width: '600px',
      data: { rating: rating || {} }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the data if needed
        this.loadRatings();
      }
    });
  }

  editRating(rating: AdminRating): void {
    const dialogRef = this.dialog.open(RatingEditDialogComponent, {
      width: '600px',
      data: { rating: rating || {} }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the data after successful edit
        this.loadRatings();
      }
    });
  }

  viewFullReview(rating: AdminRating): void {
    if (!rating.review) {
      this.snackBar.open('No review text available', 'Close', {
        duration: 3000
      });
      return;
    }

    const dialogRef = this.dialog.open(ReviewDetailDialogComponent, {
      width: '600px',
      data: {
        review: rating.review,
        rating: rating.rating,
        user: rating.user || { username: 'Unknown User', email: 'No email' },
        recipe: rating.recipe || { title: 'Unknown Recipe' },
        created_at: rating.created_at
      }
    });
  }

  deleteRating(rating: AdminRating): void {
    if (confirm(`Are you sure you want to delete this rating?`)) {
      this.adminService.deleteRating(rating.id).subscribe({
        next: () => {
          const index = (this.dataSource.data || []).findIndex(r => r.id === rating.id);
          if (index !== -1) {
            this.dataSource.data.splice(index, 1);
            this.dataSource._updateChangeSubscription();
          }
          this.snackBar.open('Rating deleted successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Failed to delete rating:', error);
          this.snackBar.open('Failed to delete rating', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }
}