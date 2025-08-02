import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { SelectionModel } from '@angular/cdk/collections';
import { AdminService } from '../../services/admin.service';
import { AdminCategory, AdminFilters } from '../../models/admin.models';

@Component({
  selector: 'app-category-management',
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
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="category-management">
      <div class="page-header">
        <h1>Category Management</h1>
        <p>Create, edit, and organize recipe categories</p>
      </div>

      <!-- Action Buttons -->
      <div class="actions-bar">
        <button mat-raised-button color="primary" (click)="createCategory()">
          <mat-icon>add</mat-icon>
          Create Category
        </button>
        <button mat-raised-button color="accent" (click)="reorderCategories()">
          <mat-icon>sort</mat-icon>
          Reorder Categories
        </button>
        <button mat-raised-button (click)="exportCategories()">
          <mat-icon>download</mat-icon>
          Export
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
            <div class="filters-grid">
              <mat-form-field appearance="fill">
                <mat-label>Search Categories</mat-label>
                <input matInput formControlName="search" placeholder="Search by name or description">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="">All Statuses</mat-option>
                  <mat-option value="active">Active</mat-option>
                  <mat-option value="inactive">Inactive</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Parent Category</mat-label>
                <mat-select formControlName="parent">
                  <mat-option value="">All Categories</mat-option>
                  <mat-option value="0">Root Categories</mat-option>
                  <mat-option *ngFor="let category of parentCategories" [value]="category.id">
                    {{ category.name }}
                  </mat-option>
                </mat-select>
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
      <div class="bulk-actions" *ngIf="selectedCategories.length > 0">
        <mat-card>
          <mat-card-content>
            <div class="bulk-actions-content">
              <span>{{ selectedCategories.length }} category(ies) selected</span>
              <div class="bulk-buttons">
                <button mat-button color="primary" (click)="bulkActivate()">
                  <mat-icon>check_circle</mat-icon>
                  Activate
                </button>
                <button mat-button color="warn" (click)="bulkDeactivate()">
                  <mat-icon>block</mat-icon>
                  Deactivate
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

      <!-- Categories Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <!-- Loading State -->
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
            <p>Loading categories...</p>
          </div>

          <!-- Table -->
          <div *ngIf="!loading" class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="categories-table">
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

              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
                <td mat-cell *matCellDef="let category">
                  <div class="category-info">
                    <div class="category-name">
                      <span class="category-indent" *ngIf="category.parent">└─</span>
                      {{ category.name }}
                    </div>
                    <div class="category-description" *ngIf="category.description">
                      {{ category.description }}
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Slug Column -->
              <ng-container matColumnDef="slug">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Slug</th>
                <td mat-cell *matCellDef="let category">
                  <code>{{ category.slug }}</code>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
                <td mat-cell *matCellDef="let category">
                  <mat-chip-set>
                    <mat-chip *ngIf="category.is_active" color="primary" variant="outlined">
                      Active
                    </mat-chip>
                    <mat-chip *ngIf="!category.is_active" color="warn" variant="outlined">
                      Inactive
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- Recipe Count Column -->
              <ng-container matColumnDef="recipe_count">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Recipes</th>
                <td mat-cell *matCellDef="let category">
                  <div class="recipe-count">
                    <mat-icon>restaurant</mat-icon>
                    {{ category.recipe_count }}
                  </div>
                </td>
              </ng-container>

              <!-- Order Column -->
              <ng-container matColumnDef="ordering">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Order</th>
                <td mat-cell *matCellDef="let category">
                  {{ category.ordering }}
                </td>
              </ng-container>

              <!-- Created Date Column -->
              <ng-container matColumnDef="created_at">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
                <td mat-cell *matCellDef="let category">{{ category.created_at | date:'short' }}</td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let category">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="viewCategory(category)">
                      <mat-icon>visibility</mat-icon>
                      <span>View Details</span>
                    </button>
                    <button mat-menu-item (click)="editCategory(category)">
                      <mat-icon>edit</mat-icon>
                      <span>Edit Category</span>
                    </button>
                    <button mat-menu-item (click)="toggleCategoryStatus(category)">
                      <mat-icon>{{ category.is_active ? 'block' : 'check_circle' }}</mat-icon>
                      <span>{{ category.is_active ? 'Deactivate' : 'Activate' }}</span>
                    </button>
                    <button mat-menu-item (click)="deleteCategory(category)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Delete Category</span>
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
                          aria-label="Select page of categories">
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .category-management {
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

    .actions-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
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

    .categories-table {
      width: 100%;
    }

    .category-info {
      display: flex;
      flex-direction: column;
    }

    .category-name {
      font-weight: 500;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .category-indent {
      color: #666;
      font-size: 0.9rem;
    }

    .category-description {
      font-size: 0.8rem;
      color: #666;
      margin-top: 4px;
    }

    .recipe-count {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }

    .recipe-count mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
      color: #666;
    }

    .selected-row {
      background-color: #e3f2fd;
    }

    .delete-action {
      color: #f44336;
    }

    code {
      background-color: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #333;
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
      .actions-bar {
        flex-direction: column;
      }

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
export class CategoryManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;
  dataSource = new MatTableDataSource<AdminCategory>();
  displayedColumns: string[] = ['select', 'name', 'slug', 'status', 'recipe_count', 'ordering', 'created_at', 'actions'];
  filtersForm: FormGroup;
  selectedCategories: AdminCategory[] = [];
  selection = new SelectionModel<AdminCategory>(true, []);
  parentCategories: AdminCategory[] = [];

  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.filtersForm = this.formBuilder.group({
      search: [''],
      status: [''],
      parent: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadParentCategories();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadCategories(): void {
    this.loading = true;
    
    const page = this.paginator?.pageIndex + 1 || 1;
    const pageSize = this.paginator?.pageSize || 25;
    const filters = this.getFiltersFromForm();

    this.adminService.getCategories(page, pageSize, filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.results;
        if (this.paginator) {
          this.paginator.length = response.pagination.total;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
        this.snackBar.open('Failed to load categories', 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  private loadParentCategories(): void {
    // Load all categories for parent selection
    this.adminService.getCategories(1, 1000).subscribe({
      next: (response) => {
        this.parentCategories = response.results;
      },
      error: (error) => {
        console.error('Failed to load parent categories:', error);
      }
    });
  }

  private getFiltersFromForm(): AdminFilters['categories'] {
    const formValue = this.filtersForm.value;
    return {
      search: formValue.search || undefined,
      status: formValue.status || undefined,
      parent: formValue.parent || undefined
    };
  }

  applyFilters(): void {
    this.paginator.pageIndex = 0;
    this.loadCategories();
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.applyFilters();
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selectedCategories.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedCategories = [];
    } else {
      this.selectedCategories = [...this.dataSource.data];
    }
  }

  // Category actions
  createCategory(): void {
    // TODO: Implement category creation dialog
    console.log('Create category');
  }

  viewCategory(category: AdminCategory): void {
    // TODO: Implement category detail view dialog
    console.log('View category:', category);
  }

  editCategory(category: AdminCategory): void {
    // TODO: Implement category edit dialog
    console.log('Edit category:', category);
  }

  toggleCategoryStatus(category: AdminCategory): void {
    const newStatus = !category.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    this.adminService.updateCategory(category.id, { is_active: newStatus }).subscribe({
      next: (updatedCategory) => {
        const index = this.dataSource.data.findIndex(c => c.id === category.id);
        if (index !== -1) {
          this.dataSource.data[index] = updatedCategory;
          this.dataSource._updateChangeSubscription();
        }
        this.snackBar.open(`Category ${action}d successfully`, 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error(`Failed to ${action} category:`, error);
        this.snackBar.open(`Failed to ${action} category`, 'Close', {
          duration: 5000
        });
      }
    });
  }

  deleteCategory(category: AdminCategory): void {
    if (category.recipe_count > 0) {
      this.snackBar.open(`Cannot delete category with ${category.recipe_count} recipes. Please reassign or delete the recipes first.`, 'Close', {
        duration: 5000
      });
      return;
    }

    if (confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      this.adminService.deleteCategory(category.id).subscribe({
        next: () => {
          const index = this.dataSource.data.findIndex(c => c.id === category.id);
          if (index !== -1) {
            this.dataSource.data.splice(index, 1);
            this.dataSource._updateChangeSubscription();
          }
          this.snackBar.open('Category deleted successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Failed to delete category:', error);
          this.snackBar.open('Failed to delete category', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }

  reorderCategories(): void {
    // TODO: Implement category reordering dialog
    console.log('Reorder categories');
  }

  exportCategories(): void {
    this.adminService.exportData('categories', 'csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'categories.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Categories exported successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Failed to export categories:', error);
        this.snackBar.open('Failed to export categories', 'Close', {
          duration: 5000
        });
      }
    });
  }

  // Bulk actions
  bulkActivate(): void {
    if (this.selectedCategories.length === 0) return;
    
    if (confirm(`Activate ${this.selectedCategories.length} category(ies)?`)) {
      // TODO: Implement bulk activate
      console.log('Bulk activate categories:', this.selectedCategories);
    }
  }

  bulkDeactivate(): void {
    if (this.selectedCategories.length === 0) return;
    
    if (confirm(`Deactivate ${this.selectedCategories.length} category(ies)?`)) {
      // TODO: Implement bulk deactivate
      console.log('Bulk deactivate categories:', this.selectedCategories);
    }
  }

  bulkDelete(): void {
    if (this.selectedCategories.length === 0) return;
    
    const categoriesWithRecipes = this.selectedCategories.filter(c => c.recipe_count > 0);
    if (categoriesWithRecipes.length > 0) {
      this.snackBar.open(`Cannot delete categories with recipes. Please reassign or delete the recipes first.`, 'Close', {
        duration: 5000
      });
      return;
    }
    
    if (confirm(`Delete ${this.selectedCategories.length} category(ies)? This action cannot be undone.`)) {
      // TODO: Implement bulk delete
      console.log('Bulk delete categories:', this.selectedCategories);
    }
  }
} 