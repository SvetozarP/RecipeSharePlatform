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
import { SelectionModel } from '@angular/cdk/collections';
import { AdminService } from '../../services/admin.service';
import { AdminUser, AdminFilters } from '../../models/admin.models';
import { UserDetailDialogComponent } from '../user-detail-dialog/user-detail-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-user-management',
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
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']})
export class UserManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;
  dataSource = new MatTableDataSource<AdminUser>();
  displayedColumns: string[] = ['select', 'username', 'email', 'first_name', 'last_name', 'status', 'date_joined', 'last_login', 'actions'];
  filtersForm: FormGroup;
  selectedUsers: AdminUser[] = [];
  selection = new SelectionModel<AdminUser>(true, []);

  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.filtersForm = this.formBuilder.group({
      search: [''],
      status: [''],
      date_joined_after: [''],
      date_joined_before: ['']
    });
  }

  ngOnInit(): void {
    // Load users after view init to ensure paginator is available
  }

  ngAfterViewInit(): void {
    // Don't connect dataSource.paginator to avoid conflicts with server-side pagination
    this.dataSource.sort = this.sort;
    
    // Subscribe to pagination events first
    if (this.paginator) {
      this.paginator.page.subscribe((event) => {
        this.loadUsers();
      });
    }
    
    // Load initial data after setting up event listeners
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading = true;
    
    const page = this.paginator?.pageIndex + 1 || 1;
    const pageSize = this.paginator?.pageSize || 25;
    const filters = this.getFiltersFromForm();

    this.adminService.getUsers(page, pageSize, filters).subscribe({
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
        console.error('Failed to load users:', error);
        this.snackBar.open('Failed to load users', 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  private getFiltersFromForm(): AdminFilters['users'] {
    const formValue = this.filtersForm.value;
    return {
      search: formValue.search || undefined,
      status: formValue.status || undefined,
      date_joined_after: formValue.date_joined_after ? formValue.date_joined_after.toISOString() : undefined,
      date_joined_before: formValue.date_joined_before ? formValue.date_joined_before.toISOString() : undefined
    };
  }

  applyFilters(): void {
    this.paginator.pageIndex = 0;
    this.loadUsers();
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.applyFilters();
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selectedUsers.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedUsers = [];
    } else {
      this.selectedUsers = [...this.dataSource.data];
    }
  }

  // Permission check methods
  canEditUser(user: AdminUser): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Superusers can edit anyone
    if (currentUser.is_superuser) return true;
    
    // Staff users cannot edit superusers
    if (currentUser.is_staff && user.is_superuser) return false;
    
    // Staff users can edit regular users and other staff
    if (currentUser.is_staff) return true;
    
    return false;
  }

  canToggleStaffStatus(user: AdminUser): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Superusers can toggle anyone's staff status
    if (currentUser.is_superuser) return true;
    
    // Staff users cannot modify superusers
    if (currentUser.is_staff && user.is_superuser) return false;
    
    // Staff users can toggle other staff status
    if (currentUser.is_staff) return true;
    
    return false;
  }

  canDeleteUser(user: AdminUser): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Superusers can delete anyone
    if (currentUser.is_superuser) return true;
    
    // Staff users cannot delete superusers
    if (currentUser.is_staff && user.is_superuser) return false;
    
    // Staff users can delete regular users and other staff
    if (currentUser.is_staff) return true;
    
    return false;
  }

  // User actions
  viewUser(user: AdminUser): void {
    const dialogRef = this.dialog.open(UserDetailDialogComponent, {
      width: '600px',
      data: { user, mode: 'view' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the user data if any changes were made
        this.loadUsers();
      }
    });
  }

  editUser(user: AdminUser): void {
    if (!this.canEditUser(user)) {
      this.snackBar.open('You do not have permission to edit this user', 'Close', {
        duration: 5000
      });
      return;
    }

    const dialogRef = this.dialog.open(UserDetailDialogComponent, {
      width: '600px',
      data: { user, mode: 'edit' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the user data if any changes were made
        this.loadUsers();
      }
    });
  }

  toggleUserStatus(user: AdminUser): void {
    if (!this.canEditUser(user)) {
      this.snackBar.open('You do not have permission to modify this user', 'Close', {
        duration: 5000
      });
      return;
    }

    const newStatus = !user.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    this.adminService.toggleUserStatus(user.id, newStatus).subscribe({
      next: (updatedUser) => {
        const index = this.dataSource.data.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.dataSource.data[index] = updatedUser;
          this.dataSource._updateChangeSubscription();
        }
        this.snackBar.open(`User ${action}d successfully`, 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error(`Failed to ${action} user:`, error);
        this.snackBar.open(`Failed to ${action} user`, 'Close', {
          duration: 5000
        });
      }
    });
  }

  toggleStaffStatus(user: AdminUser): void {
    if (!this.canToggleStaffStatus(user)) {
      this.snackBar.open('You do not have permission to modify staff status for this user', 'Close', {
        duration: 5000
      });
      return;
    }

    const newStatus = !user.is_staff;
    const action = newStatus ? 'make staff' : 'remove staff';
    
    this.adminService.toggleUserStaffStatus(user.id, newStatus).subscribe({
      next: (updatedUser) => {
        const index = this.dataSource.data.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.dataSource.data[index] = updatedUser;
          this.dataSource._updateChangeSubscription();
        }
        this.snackBar.open(`User ${action} successfully`, 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error(`Failed to ${action} user:`, error);
        this.snackBar.open(`Failed to ${action} user`, 'Close', {
          duration: 5000
        });
      }
    });
  }

  deleteUser(user: AdminUser): void {
    if (!this.canDeleteUser(user)) {
      this.snackBar.open('You do not have permission to delete this user', 'Close', {
        duration: 5000
      });
      return;
    }

    if (confirm(`Are you sure you want to delete user "${user.first_name} ${user.last_name}"?`)) {
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          const index = this.dataSource.data.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.dataSource.data.splice(index, 1);
            this.dataSource._updateChangeSubscription();
          }
          this.snackBar.open('User deleted successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Failed to delete user:', error);
          this.snackBar.open('Failed to delete user', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }

  // Bulk actions
  bulkActivate(): void {
    if (this.selectedUsers.length === 0) return;
    
    if (confirm(`Activate ${this.selectedUsers.length} user(s)?`)) {
      // TODO: Implement bulk activate
      console.log('Bulk activate users:', this.selectedUsers);
    }
  }

  bulkDeactivate(): void {
    if (this.selectedUsers.length === 0) return;
    
    if (confirm(`Deactivate ${this.selectedUsers.length} user(s)?`)) {
      // TODO: Implement bulk deactivate
      console.log('Bulk deactivate users:', this.selectedUsers);
    }
  }

  bulkMakeStaff(): void {
    if (this.selectedUsers.length === 0) return;
    
    if (confirm(`Make ${this.selectedUsers.length} user(s) staff?`)) {
      // TODO: Implement bulk make staff
      console.log('Bulk make staff users:', this.selectedUsers);
    }
  }

  bulkDelete(): void {
    if (this.selectedUsers.length === 0) return;
    
    if (confirm(`Delete ${this.selectedUsers.length} user(s)? This action cannot be undone.`)) {
      // TODO: Implement bulk delete
      console.log('Bulk delete users:', this.selectedUsers);
    }
  }
} 