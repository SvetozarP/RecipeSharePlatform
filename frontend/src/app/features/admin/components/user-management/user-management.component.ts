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
  template: `
    <div class="user-management">
      <div class="page-header">
        <h1>User Management</h1>
        <p>Manage user accounts, permissions, and status</p>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
            <div class="filters-grid">
              <mat-form-field appearance="fill">
                <mat-label>Search Users</mat-label>
                <input matInput formControlName="search" placeholder="Search by name, email, or username">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="">All Statuses</mat-option>
                  <mat-option value="active">Active</mat-option>
                  <mat-option value="inactive">Inactive</mat-option>
                  <mat-option value="staff">Staff</mat-option>
                  <mat-option value="superuser">Superuser</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Date Joined After</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="date_joined_after">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Date Joined Before</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="date_joined_before">
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
      <div class="bulk-actions" *ngIf="selectedUsers.length > 0">
        <mat-card>
          <mat-card-content>
            <div class="bulk-actions-content">
              <span>{{ selectedUsers.length }} user(s) selected</span>
              <div class="bulk-buttons">
                <button mat-button color="primary" (click)="bulkActivate()">
                  <mat-icon>check_circle</mat-icon>
                  Activate
                </button>
                <button mat-button color="warn" (click)="bulkDeactivate()">
                  <mat-icon>block</mat-icon>
                  Deactivate
                </button>
                <button mat-button color="accent" (click)="bulkMakeStaff()">
                  <mat-icon>admin_panel_settings</mat-icon>
                  Make Staff
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

      <!-- Users Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <!-- Loading State -->
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
            <p>Loading users...</p>
          </div>

          <!-- Table -->
          <div *ngIf="!loading" class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="users-table">
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
                <td mat-cell *matCellDef="let user">
                  <div class="user-info">
                    <div class="user-name">{{ user.first_name }} {{ user.last_name }}</div>
                    <div class="user-username">{{ '@' + user.username }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Email Column -->
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
                <td mat-cell *matCellDef="let user">{{ user.email }}</td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip-set>
                    <mat-chip *ngIf="user.is_active" color="primary" variant="outlined">
                      Active
                    </mat-chip>
                    <mat-chip *ngIf="!user.is_active" color="warn" variant="outlined">
                      Inactive
                    </mat-chip>
                    <mat-chip *ngIf="user.is_staff" color="accent" variant="outlined">
                      Staff
                    </mat-chip>
                    <mat-chip *ngIf="user.is_superuser" color="warn">
                      Superuser
                    </mat-chip>
                    <mat-chip *ngIf="user.is_email_verified" color="primary">
                      Verified
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <!-- Date Joined Column -->
              <ng-container matColumnDef="date_joined">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Date Joined</th>
                <td mat-cell *matCellDef="let user">{{ user.date_joined | date:'short' }}</td>
              </ng-container>

              <!-- Last Login Column -->
              <ng-container matColumnDef="last_login">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Last Login</th>
                <td mat-cell *matCellDef="let user">
                  {{ user.last_login ? (user.last_login | date:'short') : 'Never' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="viewUser(user)">
                      <mat-icon>visibility</mat-icon>
                      <span>View Details</span>
                    </button>
                    <button mat-menu-item 
                            (click)="editUser(user)"
                            [disabled]="!canEditUser(user)"
                            [matTooltip]="!canEditUser(user) ? 'You do not have permission to edit this user' : ''">
                      <mat-icon>edit</mat-icon>
                      <span>Edit User</span>
                    </button>
                    <button mat-menu-item 
                            (click)="toggleUserStatus(user)"
                            [disabled]="!canEditUser(user)"
                            [matTooltip]="!canEditUser(user) ? 'You do not have permission to modify this user' : ''">
                      <mat-icon>{{ user.is_active ? 'block' : 'check_circle' }}</mat-icon>
                      <span>{{ user.is_active ? 'Deactivate' : 'Activate' }}</span>
                    </button>
                    <button mat-menu-item 
                            (click)="toggleStaffStatus(user)"
                            [disabled]="!canToggleStaffStatus(user)"
                            [matTooltip]="!canToggleStaffStatus(user) ? 'You do not have permission to modify staff status for this user' : ''">
                      <mat-icon>{{ user.is_staff ? 'person' : 'admin_panel_settings' }}</mat-icon>
                      <span>{{ user.is_staff ? 'Remove Staff' : 'Make Staff' }}</span>
                    </button>
                    <button mat-menu-item 
                            (click)="deleteUser(user)" 
                            class="delete-action"
                            [disabled]="!canDeleteUser(user)"
                            [matTooltip]="!canDeleteUser(user) ? 'You do not have permission to delete this user' : ''">
                      <mat-icon>delete</mat-icon>
                      <span>Delete User</span>
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
                          aria-label="Select page of users">
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .user-management {
      width: 100%;
      max-width: none;
      margin: 0;
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

    .users-table {
      width: 100%;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-username {
      font-size: 0.8rem;
      color: #666;
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
export class UserManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;
  dataSource = new MatTableDataSource<AdminUser>();
  displayedColumns: string[] = ['select', 'name', 'email', 'status', 'date_joined', 'last_login', 'actions'];
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
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadUsers(): void {
    this.loading = true;
    
    const page = this.paginator?.pageIndex + 1 || 1;
    const pageSize = this.paginator?.pageSize || 25;
    const filters = this.getFiltersFromForm();

    this.adminService.getUsers(page, pageSize, filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.results;
        if (this.paginator) {
          this.paginator.length = response.pagination.total;
        }
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