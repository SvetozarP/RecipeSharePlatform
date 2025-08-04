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
  templateUrl: './recipe-moderation.component.html',
  styleUrls: ['./recipe-moderation.component.scss']})
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
    // Load categories immediately
    this.loadCategories();
    
    // Load recipes after view init to ensure paginator is available
  }

  ngAfterViewInit(): void {
    // Don't connect dataSource.paginator to avoid conflicts with server-side pagination
    this.dataSource.sort = this.sort;
    
    // Subscribe to pagination events first
    if (this.paginator) {
      this.paginator.page.subscribe((event) => {
        this.loadRecipes();
      });
    }
    
    // Load initial data after setting up event listeners
    this.loadRecipes();
  }

  private loadRecipes(): void {
    this.loading = true;
    
    const page = this.paginator?.pageIndex + 1 || 1;
    const pageSize = this.paginator?.pageSize || 25;
    const filters = this.getFiltersFromForm();

    this.adminService.getRecipes(page, pageSize, filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.results;
        
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
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.selectedRecipes = [];
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
      this.selectedRecipes = [...this.dataSource.data];
    }
  }

  onSelectionChange(): void {
    this.selectedRecipes = this.selection.selected;
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
      const recipeIds = this.selectedRecipes.map(r => r.id);
      
      let completed = 0;
      let failed = 0;
      
      recipeIds.forEach(recipeId => {
        this.adminService.approveRecipe(recipeId).subscribe({
          next: (updatedRecipe) => {
            completed++;
            // Update the recipe in the data source
            const index = this.dataSource.data.findIndex(r => r.id === recipeId);
            if (index !== -1) {
              this.dataSource.data[index] = updatedRecipe;
            }
            
            if (completed + failed === recipeIds.length) {
              this.handleBulkOperationComplete(completed, failed, 'approved');
            }
          },
          error: (error) => {
            console.error('Failed to approve recipe:', error);
            failed++;
            if (completed + failed === recipeIds.length) {
              this.handleBulkOperationComplete(completed, failed, 'approved');
            }
          }
        });
      });
    }
  }

  bulkReject(): void {
    if (this.selectedRecipes.length === 0) return;
    
    const reason = prompt('Please provide a reason for rejection:');
    if (reason !== null && reason.trim() !== '') {
      const recipeIds = this.selectedRecipes.map(r => r.id);
      
      let completed = 0;
      let failed = 0;
      
      recipeIds.forEach(recipeId => {
        this.adminService.rejectRecipe(recipeId, reason).subscribe({
          next: (updatedRecipe) => {
            completed++;
            // Update the recipe in the data source
            const index = this.dataSource.data.findIndex(r => r.id === recipeId);
            if (index !== -1) {
              this.dataSource.data[index] = updatedRecipe;
            }
            
            if (completed + failed === recipeIds.length) {
              this.handleBulkOperationComplete(completed, failed, 'rejected');
            }
          },
          error: (error) => {
            console.error('Failed to reject recipe:', error);
            failed++;
            if (completed + failed === recipeIds.length) {
              this.handleBulkOperationComplete(completed, failed, 'rejected');
            }
          }
        });
      });
    }
  }

  bulkPublish(): void {
    if (this.selectedRecipes.length === 0) return;
    
    if (confirm(`Publish ${this.selectedRecipes.length} recipe(s)?`)) {
      const recipeIds = this.selectedRecipes.map(r => r.id);
      
      let completed = 0;
      let failed = 0;
      
      recipeIds.forEach(recipeId => {
        this.adminService.updateRecipe(recipeId, { is_published: true }).subscribe({
          next: (updatedRecipe) => {
            completed++;
            // Update the recipe in the data source
            const index = this.dataSource.data.findIndex(r => r.id === recipeId);
            if (index !== -1) {
              this.dataSource.data[index] = updatedRecipe;
            }
            
            if (completed + failed === recipeIds.length) {
              this.handleBulkOperationComplete(completed, failed, 'published');
            }
          },
          error: (error) => {
            console.error('Failed to publish recipe:', error);
            failed++;
            if (completed + failed === recipeIds.length) {
              this.handleBulkOperationComplete(completed, failed, 'published');
            }
          }
        });
      });
    }
  }

  bulkDelete(): void {
    if (this.selectedRecipes.length === 0) return;
    
    if (confirm(`Delete ${this.selectedRecipes.length} recipe(s)? This action cannot be undone.`)) {
      const recipeIds = this.selectedRecipes.map(r => r.id);
      
      let completed = 0;
      let failed = 0;
      
      recipeIds.forEach(recipeId => {
        this.adminService.deleteRecipe(recipeId).subscribe({
          next: () => {
            completed++;
            // Remove the recipe from the data source
            const index = this.dataSource.data.findIndex(r => r.id === recipeId);
            if (index !== -1) {
              this.dataSource.data.splice(index, 1);
            }
            
            if (completed + failed === recipeIds.length) {
              this.handleBulkOperationComplete(completed, failed, 'deleted');
            }
          },
          error: (error) => {
            console.error('Failed to delete recipe:', error);
            failed++;
            if (completed + failed === recipeIds.length) {
              this.handleBulkOperationComplete(completed, failed, 'deleted');
            }
          }
        });
      });
    }
  }

  private handleBulkOperationComplete(completed: number, failed: number, action: string): void {
    // Clear selection
    this.selectedRecipes = [];
    this.selection.clear();
    
    // Update the data source to reflect changes
    this.dataSource._updateChangeSubscription();
    
    // Show appropriate message
    if (failed === 0) {
      this.snackBar.open(`Successfully ${action} ${completed} recipe(s)`, 'Close', {
        duration: 3000
      });
    } else if (completed === 0) {
      this.snackBar.open(`Failed to ${action} any recipes`, 'Close', {
        duration: 5000
      });
    } else {
      this.snackBar.open(`Successfully ${action} ${completed} recipe(s), ${failed} failed`, 'Close', {
        duration: 5000
      });
    }
    
    // Refresh the data to ensure consistency
    this.loadRecipes();
  }
} 