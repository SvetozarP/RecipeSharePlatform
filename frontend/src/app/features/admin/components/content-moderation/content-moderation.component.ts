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
  template: `
    <div class="content-moderation">
      <div class="page-header">
        <h1>Content Moderation</h1>
        <p>Review and manage ratings, reviews, and user-generated content</p>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
            <div class="filters-grid">
              <mat-form-field appearance="fill">
                <mat-label>Search Content</mat-label>
                <input matInput formControlName="search" placeholder="Search in reviews or recipe titles">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Rating</mat-label>
                <mat-select formControlName="rating">
                  <mat-option value="">All Ratings</mat-option>
                  <mat-option value="5">5 Stars</mat-option>
                  <mat-option value="4">4 Stars</mat-option>
                  <mat-option value="3">3 Stars</mat-option>
                  <mat-option value="2">2 Stars</mat-option>
                  <mat-option value="1">1 Star</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="">All Statuses</mat-option>
                  <mat-option value="approved">Approved</mat-option>
                  <mat-option value="pending">Pending</mat-option>
                  <mat-option value="rejected">Rejected</mat-option>
                  <mat-option value="flagged">Flagged</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Date Created After</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="date_created_after">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Date Created Before</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="date_created_before">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="filters-actions">
              <button mat-button type="button" (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Clear Filters
              </button>
              <button mat-raised-button color="primary" type="submit">
                <mat-icon>filter_list</mat-icon>
                Apply Filters
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Bulk Actions -->
      <div class="bulk-actions" *ngIf="selectedRatings.length > 0">
        <mat-card>
          <mat-card-content>
            <div class="bulk-actions-content">
              <span>{{ selectedRatings.length }} rating(s) selected</span>
              <div class="bulk-buttons">
                <button mat-button color="primary" (click)="bulkApprove()">
                  <mat-icon>check_circle</mat-icon>
                  Approve
                </button>
                <button mat-button color="warn" (click)="bulkReject()">
                  <mat-icon>cancel</mat-icon>
                  Reject
                </button>
                <button mat-button color="accent" (click)="bulkFlag()">
                  <mat-icon>flag</mat-icon>
                  Flag
                </button>
                <button mat-button color="warn" (click)="bulkDelete()">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Ratings Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <!-- Loading State -->
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
            <p>Loading ratings...</p>
          </div>

          <!-- Table -->
          <div *ngIf="!loading" class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="ratings-table">
              <!-- Checkbox Column -->
              <ng-container matColumnDef="select">
                <th mat-header-cell *matHeaderCellDef>
                  <mat-checkbox (change)="$event ? masterToggle() : null"
                               [checked]="selection.hasValue() && isAllSelected()"
                               [indeterminate]="selection.hasValue() && !isAllSelected()">
                  </mat-checkbox>
                </th>
                <td mat-cell *matCellDef="let row">
                  <mat-checkbox (click)="$event.stopPropagation()"
                               (change)="$event ? selection.toggle(row) : null"
                               [checked]="selection.isSelected(row)">
                  </mat-checkbox>
                </td>
              </ng-container>

              <!-- Rating Column -->
              <ng-container matColumnDef="rating">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Rating</th>
                <td mat-cell *matCellDef="let rating">
                  <div class="rating-display">
                    <div class="stars">
                      <span *ngFor="let star of [1,2,3,4,5]" 
                            [class.filled]="star <= rating.rating"
                            class="star">
                        ★
                      </span>
                    </div>
                    <div class="rating-value">{{ rating.rating }}/5</div>
                  </div>
                </td>
              </ng-container>

              <!-- Recipe Column -->
              <ng-container matColumnDef="recipe">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Recipe</th>
                <td mat-cell *matCellDef="let rating">
                  <div class="recipe-info">
                    <div class="recipe-title">{{ rating.recipe.title }}</div>
                    <div class="recipe-slug">{{ rating.recipe.slug }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- User Column -->
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>User</th>
                <td mat-cell *matCellDef="let rating">
                  <div class="user-info">
                    <div class="user-name">{{ rating.user.username }}</div>
                    <div class="user-email">{{ rating.user.email }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Review Column -->
              <ng-container matColumnDef="review">
                <th mat-header-cell *matHeaderCellDef>Review</th>
                <td mat-cell *matCellDef="let rating">
                  <div class="review-content" *ngIf="rating.review">
                    <p>{{ rating.review | slice:0:100 }}{{ rating.review.length > 100 ? '...' : '' }}</p>
                    <button mat-button color="primary" (click)="viewFullReview(rating)" *ngIf="rating.review.length > 100">
                      Read More
                    </button>
                  </div>
                  <span class="no-review" *ngIf="!rating.review">No review text</span>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
                <td mat-cell *matCellDef="let rating">
                  <mat-chip-set>
                    <mat-chip *ngIf="rating.moderation_status === 'approved'" color="primary" variant="outlined">
                      Approved
                    </mat-chip>
                    <mat-chip *ngIf="rating.moderation_status === 'pending'" color="warn" variant="outlined">
                      Pending
                    </mat-chip>
                    <mat-chip *ngIf="rating.moderation_status === 'rejected'" color="warn">
                      Rejected
                    </mat-chip>
                    <mat-chip *ngIf="rating.moderation_status === 'flagged'" color="accent">
                      Flagged
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- Engagement Column -->
              <ng-container matColumnDef="engagement">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Engagement</th>
                <td mat-cell *matCellDef="let rating">
                  <div class="engagement-info">
                    <div class="engagement-item">
                      <mat-icon>thumb_up</mat-icon>
                      {{ rating.helpful_count }}
                    </div>
                    <div class="engagement-item" *ngIf="rating.is_verified_purchase">
                      <mat-icon>verified</mat-icon>
                      Verified
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Date Created Column -->
              <ng-container matColumnDef="created_at">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
                <td mat-cell *matCellDef="let rating">{{ rating.created_at | date:'short' }}</td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let rating">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="viewRating(rating)">
                      <mat-icon>visibility</mat-icon>
                      <span>View Details</span>
                    </button>
                    <button mat-menu-item (click)="editRating(rating)">
                      <mat-icon>edit</mat-icon>
                      <span>Edit Rating</span>
                    </button>
                    <button mat-menu-item (click)="approveRating(rating)" *ngIf="rating.moderation_status !== 'approved'">
                      <mat-icon>check_circle</mat-icon>
                      <span>Approve</span>
                    </button>
                    <button mat-menu-item (click)="rejectRating(rating)" *ngIf="rating.moderation_status !== 'rejected'">
                      <mat-icon>cancel</mat-icon>
                      <span>Reject</span>
                    </button>
                    <button mat-menu-item (click)="flagRating(rating)" *ngIf="rating.moderation_status !== 'flagged'">
                      <mat-icon>flag</mat-icon>
                      <span>Flag for Review</span>
                    </button>
                    <button mat-menu-item (click)="deleteRating(rating)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Delete Rating</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                  [class.selected-row]="selection.isSelected(row)"
                  (click)="selection.toggle(row)">
              </tr>
            </table>

            <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]"
                          showFirstLastButtons
                          aria-label="Select page of ratings">
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .content-moderation {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 2rem;
    }

    .page-header p {
      margin: 0;
      color: #666;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .filters-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .bulk-actions {
      margin-bottom: 24px;
    }

    .bulk-actions-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bulk-buttons {
      display: flex;
      gap: 8px;
    }

    .table-card {
      margin-bottom: 24px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .table-container {
      overflow-x: auto;
    }

    .ratings-table {
      width: 100%;
    }

    .rating-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    .star {
      color: #ddd;
      font-size: 1.2rem;
    }

    .star.filled {
      color: #ffc107;
    }

    .rating-value {
      font-size: 0.8rem;
      color: #666;
      font-weight: 500;
    }

    .recipe-info {
      display: flex;
      flex-direction: column;
    }

    .recipe-title {
      font-weight: 500;
      color: #333;
    }

    .recipe-slug {
      font-size: 0.8rem;
      color: #666;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-email {
      font-size: 0.8rem;
      color: #666;
    }

    .review-content {
      max-width: 300px;
    }

    .review-content p {
      margin: 0 0 8px 0;
      line-height: 1.4;
      color: #333;
    }

    .no-review {
      color: #999;
      font-style: italic;
      font-size: 0.8rem;
    }

    .engagement-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .engagement-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
    }

    .engagement-item mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .selected-row {
      background-color: #e3f2fd;
    }

    .delete-action {
      color: #f44336;
    }

    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    mat-chip {
      font-size: 0.7rem;
    }

    @media (max-width: 768px) {
      .filters-grid {
        grid-template-columns: 1fr;
      }

      .filters-actions {
        flex-direction: column;
      }

      .bulk-actions-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .bulk-buttons {
        justify-content: center;
        flex-wrap: wrap;
      }

      .review-content {
        max-width: 200px;
      }
    }
  `]
})
export class ContentModerationComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;
  dataSource = new MatTableDataSource<AdminRating>();
  displayedColumns: string[] = ['select', 'rating', 'recipe', 'user', 'review', 'status', 'engagement', 'created_at', 'actions'];
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
      status: [''],
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
      status: formValue.status || undefined,
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
      this.selectedRatings = [];
    } else {
      this.selectedRatings = [...this.dataSource.data];
    }
  }

  // Rating actions
  viewRating(rating: AdminRating): void {
    // TODO: Implement rating detail view dialog
    console.log('View rating:', rating);
  }

  editRating(rating: AdminRating): void {
    // TODO: Implement rating edit dialog
    console.log('Edit rating:', rating);
  }

  viewFullReview(rating: AdminRating): void {
    // TODO: Implement full review view dialog
    console.log('View full review:', rating.review);
  }

  approveRating(rating: AdminRating): void {
    this.adminService.approveRating(rating.id).subscribe({
      next: (updatedRating) => {
        const index = this.dataSource.data.findIndex(r => r.id === rating.id);
        if (index !== -1) {
          this.dataSource.data[index] = updatedRating;
          this.dataSource._updateChangeSubscription();
        }
        this.snackBar.open('Rating approved successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Failed to approve rating:', error);
        this.snackBar.open('Failed to approve rating', 'Close', {
          duration: 5000
        });
      }
    });
  }

  rejectRating(rating: AdminRating): void {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason !== null) {
      this.adminService.rejectRating(rating.id, reason).subscribe({
        next: (updatedRating) => {
          const index = this.dataSource.data.findIndex(r => r.id === rating.id);
          if (index !== -1) {
            this.dataSource.data[index] = updatedRating;
            this.dataSource._updateChangeSubscription();
          }
          this.snackBar.open('Rating rejected successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Failed to reject rating:', error);
          this.snackBar.open('Failed to reject rating', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }

  flagRating(rating: AdminRating): void {
    const reason = prompt('Please provide a reason for flagging:');
    if (reason !== null) {
      this.adminService.flagRating(rating.id, reason).subscribe({
        next: (updatedRating) => {
          const index = this.dataSource.data.findIndex(r => r.id === rating.id);
          if (index !== -1) {
            this.dataSource.data[index] = updatedRating;
            this.dataSource._updateChangeSubscription();
          }
          this.snackBar.open('Rating flagged successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Failed to flag rating:', error);
          this.snackBar.open('Failed to flag rating', 'Close', {
            duration: 5000
          });
        }
      });
    }
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
  bulkApprove(): void {
    if (this.selectedRatings.length === 0) return;
    
    if (confirm(`Approve ${this.selectedRatings.length} rating(s)?`)) {
      // TODO: Implement bulk approve
      console.log('Bulk approve ratings:', this.selectedRatings);
    }
  }

  bulkReject(): void {
    if (this.selectedRatings.length === 0) return;
    
    const reason = prompt('Please provide a reason for rejection:');
    if (reason !== null) {
      // TODO: Implement bulk reject
      console.log('Bulk reject ratings:', this.selectedRatings, 'Reason:', reason);
    }
  }

  bulkFlag(): void {
    if (this.selectedRatings.length === 0) return;
    
    const reason = prompt('Please provide a reason for flagging:');
    if (reason !== null) {
      // TODO: Implement bulk flag
      console.log('Bulk flag ratings:', this.selectedRatings, 'Reason:', reason);
    }
  }

  bulkDelete(): void {
    if (this.selectedRatings.length === 0) return;
    
    if (confirm(`Delete ${this.selectedRatings.length} rating(s)? This action cannot be undone.`)) {
      // TODO: Implement bulk delete
      console.log('Bulk delete ratings:', this.selectedRatings);
    }
  }
} 