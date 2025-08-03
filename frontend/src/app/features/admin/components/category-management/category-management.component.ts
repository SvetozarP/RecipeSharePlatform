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
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
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
    // Load categories after view init to ensure paginator is available
  }

  ngAfterViewInit(): void {
    // Don't connect dataSource.paginator to avoid conflicts with server-side pagination
    this.dataSource.sort = this.sort;
    
    // Load initial data
    this.loadCategories();
    this.loadParentCategories();
    
    // Subscribe to pagination events
    this.paginator.page.subscribe(() => {
      this.loadCategories();
    });
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