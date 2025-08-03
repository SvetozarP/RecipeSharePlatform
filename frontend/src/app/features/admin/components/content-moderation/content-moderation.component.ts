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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { SelectionModel } from '@angular/cdk/collections';
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
    MatCheckboxModule,
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
  displayedColumns: string[] = ['select', 'rating', 'recipe', 'user', 'review', 'engagement', 'created_at', 'actions'];
  filtersForm: FormGroup;
  selectedRatings: AdminRating[] = [];
  selection = new SelectionModel<AdminRating>(true, []);

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
    this.loadRatings();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Subscribe to pagination events
    this.paginator.page.subscribe(() => {
      this.loadRatings();
    });
  }

  private loadRatings(): void {
    this.loading = true;
    
    const page = this.paginator?.pageIndex + 1 || 1;
    const pageSize = this.paginator?.pageSize || 25;
    const filters = this.getFiltersFromForm();

    this.adminService.getRatings(page, pageSize, filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.results;
        if (this.paginator) {
          this.paginator.length = response.pagination.total;
        }
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
    const formValue = this.filtersForm.value;
    return {
      search: formValue.search || undefined,
      rating: formValue.rating || undefined,
      date_created_after: formValue.date_created_after ? formValue.date_created_after.toISOString() : undefined,
      date_created_before: formValue.date_created_before ? formValue.date_created_before.toISOString() : undefined
    };
  }

  applyFilters(): void {
    this.paginator.pageIndex = 0;
    this.loadRatings();
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.applyFilters();
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selectedRatings.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.selectedRatings = [];
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
      this.selectedRatings = [...this.dataSource.data];
    }
  }

  onSelectionChange(): void {
    this.selectedRatings = this.selection.selected;
  }

  onCheckboxChange(event: any, row: AdminRating): void {
    if (event.checked) {
      this.selection.select(row);
    } else {
      this.selection.deselect(row);
    }
    this.onSelectionChange();
  }

  // Rating actions
  viewRating(rating: AdminRating): void {
    const dialogRef = this.dialog.open(RatingDetailDialogComponent, {
      width: '600px',
      data: { rating }
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
      data: { rating }
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
        user: rating.user,
        recipe: rating.recipe,
        created_at: rating.created_at
      }
    });
  }

  deleteRating(rating: AdminRating): void {
    if (confirm(`Are you sure you want to delete this rating?`)) {
      this.adminService.deleteRating(rating.id).subscribe({
        next: () => {
          const index = this.dataSource.data.findIndex(r => r.id === rating.id);
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

  // Bulk actions
  bulkDelete(): void {
    if (this.selectedRatings.length === 0) return;
    
    if (confirm(`Delete ${this.selectedRatings.length} rating(s)? This action cannot be undone.`)) {
      const ratingIds = this.selectedRatings.map(r => r.id);
      
      let completed = 0;
      let failed = 0;
      
      ratingIds.forEach(ratingId => {
        this.adminService.deleteRating(ratingId).subscribe({
          next: () => {
            completed++;
            if (completed + failed === ratingIds.length) {
              this.handleBulkOperationComplete(completed, failed, 'deleted');
            }
          },
          error: () => {
            failed++;
            if (completed + failed === ratingIds.length) {
              this.handleBulkOperationComplete(completed, failed, 'deleted');
            }
          }
        });
      });
    }
  }

  private handleBulkOperationComplete(completed: number, failed: number, action: string): void {
    this.selectedRatings = [];
    this.selection.clear();
    
    if (failed === 0) {
      this.snackBar.open(`Successfully ${action} ${completed} rating(s)`, 'Close', {
        duration: 3000
      });
    } else if (completed === 0) {
      this.snackBar.open(`Failed to ${action} any ratings`, 'Close', {
        duration: 5000
      });
    } else {
      this.snackBar.open(`Successfully ${action} ${completed} rating(s), ${failed} failed`, 'Close', {
        duration: 5000
      });
    }
    
    // Refresh the data
    this.loadRatings();
  }
}