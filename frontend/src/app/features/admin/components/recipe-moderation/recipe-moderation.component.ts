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
    this.loadRecipes();
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Subscribe to pagination events
    this.paginator.page.subscribe(() => {
      this.loadRecipes();
    });
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