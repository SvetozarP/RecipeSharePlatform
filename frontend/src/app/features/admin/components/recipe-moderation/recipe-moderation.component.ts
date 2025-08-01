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
import { AdminRecipe, AdminFilters } from '../../models/admin.models';
import { RecipeDetailDialogComponent } from '../recipe-detail-dialog/recipe-detail-dialog.component';

@Component({
  selector: 'app-recipe-moderation',
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
    <div class="recipe-moderation">
      <div class="page-header">
        <h1>Recipe Moderation</h1>
        <p>Review and manage recipe submissions</p>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
            <div class="filters-grid">
              <mat-form-field appearance="fill">
                <mat-label>Search Recipes</mat-label>
                <input matInput formControlName="search" placeholder="Search by title, description, or author">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="">All Statuses</mat-option>
                  <mat-option value="published">Published</mat-option>
                  <mat-option value="draft">Draft</mat-option>
                  <mat-option value="pending">Pending</mat-option>
                  <mat-option value="rejected">Rejected</mat-option>
                  <mat-option value="flagged">Flagged</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Author</mat-label>
                <input matInput formControlName="author" placeholder="Search by author">
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Category</mat-label>
                <mat-select formControlName="category">
                  <mat-option value="">All Categories</mat-option>
                  <mat-option *ngFor="let category of categories" [value]="category.id">
                    {{ category.name }}
                  </mat-option>
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
      <div class="bulk-actions" *ngIf="selectedRecipes.length > 0">
        <mat-card>
          <mat-card-content>
            <div class="bulk-actions-content">
              <span>{{ selectedRecipes.length }} recipe(s) selected</span>
              <div class="bulk-buttons">
                <button mat-button color="primary" (click)="bulkApprove()">
                  <mat-icon>check_circle</mat-icon>
                  Approve
                </button>
                <button mat-button color="warn" (click)="bulkReject()">
                  <mat-icon>cancel</mat-icon>
                  Reject
                </button>
                <button mat-button color="accent" (click)="bulkPublish()">
                  <mat-icon>publish</mat-icon>
                  Publish
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

      <!-- Recipes Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <!-- Loading State -->
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
            <p>Loading recipes...</p>
          </div>

          <!-- Table -->
          <div *ngIf="!loading" class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="recipes-table">
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

              <!-- Title Column -->
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
                <td mat-cell *matCellDef="let recipe">
                  <div class="recipe-info">
                    <div class="recipe-title">{{ recipe.title }}</div>
                    <div class="recipe-description">{{ recipe.description | slice:0:100 }}{{ recipe.description.length > 100 ? '...' : '' }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Author Column -->
              <ng-container matColumnDef="author">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Author</th>
                <td mat-cell *matCellDef="let recipe">
                  <div class="author-info">
                    <div class="author-name">{{ recipe.author.username }}</div>
                    <div class="author-email">{{ recipe.author.email }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Categories Column -->
              <ng-container matColumnDef="categories">
                <th mat-header-cell *matHeaderCellDef>Categories</th>
                <td mat-cell *matCellDef="let recipe">
                  <mat-chip-set>
                    <mat-chip *ngFor="let category of recipe.categories" 
                             [color]="category.color ? 'primary' : 'default'" 
                             variant="outlined">
                      {{ category.name }}
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
                <td mat-cell *matCellDef="let recipe">
                  <mat-chip-set>
                    <mat-chip *ngIf="recipe.moderation_status === 'approved' && recipe.is_published" color="primary" variant="outlined">
                      Published
                    </mat-chip>
                    <mat-chip *ngIf="recipe.moderation_status === 'draft'" color="basic" variant="outlined">
                      Draft
                    </mat-chip>
                    <mat-chip *ngIf="recipe.moderation_status === 'pending'" color="warn" variant="outlined">
                      Pending
                    </mat-chip>
                    <mat-chip *ngIf="recipe.moderation_status === 'rejected'" color="warn">
                      Rejected
                    </mat-chip>
                    <mat-chip *ngIf="recipe.moderation_status === 'flagged'" color="accent">
                      Flagged
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- Rating Stats Column -->
              <ng-container matColumnDef="rating_stats">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Rating</th>
                <td mat-cell *matCellDef="let recipe">
                  <div class="rating-info">
                    <div class="rating-average">{{ recipe.rating_stats.average_rating.toFixed(1) }} ⭐</div>
                    <div class="rating-count">({{ recipe.rating_stats.total_ratings }} reviews)</div>
                  </div>
                </td>
              </ng-container>

              <!-- Engagement Column -->
              <ng-container matColumnDef="engagement">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Engagement</th>
                <td mat-cell *matCellDef="let recipe">
                  <div class="engagement-info">
                    <div class="engagement-item">
                      <mat-icon>visibility</mat-icon>
                      {{ recipe.view_count }}
                    </div>
                    <div class="engagement-item">
                      <mat-icon>favorite</mat-icon>
                      {{ recipe.favorite_count }}
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Date Created Column -->
              <ng-container matColumnDef="created_at">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
                <td mat-cell *matCellDef="let recipe">{{ recipe.created_at | date:'short' }}</td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let recipe">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="viewRecipe(recipe)">
                      <mat-icon>visibility</mat-icon>
                      <span>View Recipe</span>
                    </button>
                    <button mat-menu-item (click)="editRecipe(recipe)">
                      <mat-icon>edit</mat-icon>
                      <span>Edit Recipe</span>
                    </button>
                    <button mat-menu-item (click)="approveRecipe(recipe)" *ngIf="recipe.moderation_status !== 'approved'">
                      <mat-icon>check_circle</mat-icon>
                      <span>Approve</span>
                    </button>
                    <button mat-menu-item (click)="rejectRecipe(recipe)" *ngIf="recipe.moderation_status !== 'rejected'">
                      <mat-icon>cancel</mat-icon>
                      <span>Reject</span>
                    </button>
                    <button mat-menu-item (click)="flagRecipe(recipe)">
                      <mat-icon>flag</mat-icon>
                      <span>Flag for Review</span>
                    </button>
                    <button mat-menu-item (click)="deleteRecipe(recipe)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Delete Recipe</span>
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
                          aria-label="Select page of recipes">
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .recipe-moderation {
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

    .recipes-table {
      width: 100%;
    }

    .recipe-info {
      display: flex;
      flex-direction: column;
    }

    .recipe-title {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .recipe-description {
      font-size: 0.8rem;
      color: #666;
      line-height: 1.2;
    }

    .author-info {
      display: flex;
      flex-direction: column;
    }

    .author-name {
      font-weight: 500;
      color: #333;
    }

    .author-email {
      font-size: 0.8rem;
      color: #666;
    }

    .rating-info {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .rating-average {
      font-weight: 500;
      color: #333;
    }

    .rating-count {
      font-size: 0.8rem;
      color: #666;
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
    }
  `]
})
export class RecipeModerationComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;
  dataSource = new MatTableDataSource<AdminRecipe>();
  displayedColumns: string[] = ['select', 'title', 'author', 'categories', 'status', 'rating_stats', 'engagement', 'created_at', 'actions'];
  filtersForm: FormGroup;
  selectedRecipes: AdminRecipe[] = [];
  selection = new SelectionModel<AdminRecipe>(true, []);
  categories: Array<{ id: number; name: string }> = [];

  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.filtersForm = this.formBuilder.group({
      search: [''],
      status: [''],
      author: [''],
      category: [''],
      date_created_after: [''],
      date_created_before: ['']
    });
  }

  ngOnInit(): void {
    this.loadRecipes();
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadRecipes(): void {
    this.loading = true;
    
    const page = this.paginator?.pageIndex + 1 || 1;
    const pageSize = this.paginator?.pageSize || 25;
    const filters = this.getFiltersFromForm();

    this.adminService.getRecipes(page, pageSize, filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.results;
        if (this.paginator) {
          this.paginator.length = response.pagination.total;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load recipes:', error);
        this.snackBar.open('Failed to load recipes', 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  private loadCategories(): void {
    // TODO: Load categories from admin service
    this.categories = [
      { id: 1, name: 'Main Dishes' },
      { id: 2, name: 'Desserts' },
      { id: 3, name: 'Appetizers' },
      { id: 4, name: 'Beverages' }
    ];
  }

  private getFiltersFromForm(): AdminFilters['recipes'] {
    const formValue = this.filtersForm.value;
    return {
      search: formValue.search || undefined,
      status: formValue.status || undefined,
      author: formValue.author || undefined,
      category: formValue.category || undefined,
      date_created_after: formValue.date_created_after ? formValue.date_created_after.toISOString() : undefined,
      date_created_before: formValue.date_created_before ? formValue.date_created_before.toISOString() : undefined
    };
  }

  applyFilters(): void {
    this.paginator.pageIndex = 0;
    this.loadRecipes();
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.applyFilters();
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selectedRecipes.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedRecipes = [];
    } else {
      this.selectedRecipes = [...this.dataSource.data];
    }
  }

  // Recipe actions
  viewRecipe(recipe: AdminRecipe): void {
    const dialogRef = this.dialog.open(RecipeDetailDialogComponent, {
      width: '700px',
      data: { recipe, mode: 'view' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the recipe data if any changes were made
        this.loadRecipes();
      }
    });
  }

  editRecipe(recipe: AdminRecipe): void {
    const dialogRef = this.dialog.open(RecipeDetailDialogComponent, {
      width: '700px',
      data: { recipe, mode: 'edit' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the recipe data if any changes were made
        this.loadRecipes();
      }
    });
  }

  approveRecipe(recipe: AdminRecipe): void {
    this.adminService.approveRecipe(recipe.id).subscribe({
      next: (updatedRecipe) => {
        const index = this.dataSource.data.findIndex(r => r.id === recipe.id);
        if (index !== -1) {
          this.dataSource.data[index] = updatedRecipe;
          this.dataSource._updateChangeSubscription();
        }
        this.snackBar.open('Recipe approved successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Failed to approve recipe:', error);
        this.snackBar.open('Failed to approve recipe', 'Close', {
          duration: 5000
        });
      }
    });
  }

  rejectRecipe(recipe: AdminRecipe): void {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason !== null) {
      this.adminService.rejectRecipe(recipe.id, reason).subscribe({
        next: (updatedRecipe) => {
          const index = this.dataSource.data.findIndex(r => r.id === recipe.id);
          if (index !== -1) {
            this.dataSource.data[index] = updatedRecipe;
            this.dataSource._updateChangeSubscription();
          }
          this.snackBar.open('Recipe rejected successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Failed to reject recipe:', error);
          this.snackBar.open('Failed to reject recipe', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }

  flagRecipe(recipe: AdminRecipe): void {
    const reason = prompt('Please provide a reason for flagging:');
    if (reason !== null) {
      this.adminService.flagRecipe(recipe.id, reason).subscribe({
        next: (updatedRecipe) => {
          const index = this.dataSource.data.findIndex(r => r.id === recipe.id);
          if (index !== -1) {
            this.dataSource.data[index] = updatedRecipe;
            this.dataSource._updateChangeSubscription();
          }
          this.snackBar.open('Recipe flagged successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Failed to flag recipe:', error);
          this.snackBar.open('Failed to flag recipe', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }

  deleteRecipe(recipe: AdminRecipe): void {
    if (confirm(`Are you sure you want to delete recipe "${recipe.title}"?`)) {
      this.adminService.deleteRecipe(recipe.id).subscribe({
        next: () => {
          const index = this.dataSource.data.findIndex(r => r.id === recipe.id);
          if (index !== -1) {
            this.dataSource.data.splice(index, 1);
            this.dataSource._updateChangeSubscription();
          }
          this.snackBar.open('Recipe deleted successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Failed to delete recipe:', error);
          this.snackBar.open('Failed to delete recipe', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }

  // Bulk actions
  bulkApprove(): void {
    if (this.selectedRecipes.length === 0) return;
    
    if (confirm(`Approve ${this.selectedRecipes.length} recipe(s)?`)) {
      // TODO: Implement bulk approve
      console.log('Bulk approve recipes:', this.selectedRecipes);
    }
  }

  bulkReject(): void {
    if (this.selectedRecipes.length === 0) return;
    
    const reason = prompt('Please provide a reason for rejection:');
    if (reason !== null) {
      // TODO: Implement bulk reject
      console.log('Bulk reject recipes:', this.selectedRecipes, 'Reason:', reason);
    }
  }

  bulkPublish(): void {
    if (this.selectedRecipes.length === 0) return;
    
    if (confirm(`Publish ${this.selectedRecipes.length} recipe(s)?`)) {
      // TODO: Implement bulk publish
      console.log('Bulk publish recipes:', this.selectedRecipes);
    }
  }

  bulkDelete(): void {
    if (this.selectedRecipes.length === 0) return;
    
    if (confirm(`Delete ${this.selectedRecipes.length} recipe(s)? This action cannot be undone.`)) {
      // TODO: Implement bulk delete
      console.log('Bulk delete recipes:', this.selectedRecipes);
    }
  }
} 