import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';
import { AuthService } from '../../../core/services/auth.service';
import { Employee, EmploymentStatus, Gender } from '../../../core/models/erp.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IconComponent,
    BadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
    PaginationComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="employee-page">
      <!-- Page Header -->
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">Employee & Human Resource Directory</h2>
          <p class="erp-card-subtitle">Manage organization personnel, profiles, compensation, and active workforce status</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openAddModal()" *ngIf="canManage">
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Add New Employee</span>
        </button>
      </div>

      <!-- Toolbar: Search, Filter, Sort -->
      <div class="toolbar-container">
        <div class="search-box">
          <app-icon name="search" [size]="16"></app-icon>
          <input
            type="text"
            class="form-control"
            placeholder="Search by name, ID, email, designation..."
            [value]="searchQuery"
            (input)="onSearch($event)"
          />
        </div>

        <div class="filter-bar">
          <!-- Department Filter -->
          <select class="form-select" (change)="onDeptFilter($event)">
            <option value="All">All Departments</option>
            <option *ngFor="let dept of deptService.departments()" [value]="dept.name">
              {{ dept.name }}
            </option>
          </select>

          <!-- Employment Status Filter -->
          <select class="form-select" (change)="onStatusFilter($event)">
            <option value="All">All Statuses</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Probation">Probation</option>
            <option value="Terminated">Terminated</option>
          </select>

          <!-- Sort Selector -->
          <select class="form-select" (change)="onSortChange($event)">
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="name_desc">Sort: Name (Z-A)</option>
            <option value="salary_desc">Sort: Highest Salary</option>
            <option value="salary_asc">Sort: Lowest Salary</option>
            <option value="date_desc">Sort: Recently Joined</option>
          </select>
        </div>
      </div>

      <!-- Employee Table Card -->
      <div class="erp-card table-card">
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Contact</th>
                <th>Joining Date</th>
                <th>Monthly Salary</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of pagedEmployees">
                <td>
                  <div class="emp-profile-cell">
                    <img
                      [src]="emp.avatar || defaultAvatar"
                      (error)="onAvatarError($event)"
                      alt="Avatar"
                      class="emp-thumb"
                    />
                    <div>
                      <div class="emp-name">{{ emp.fullName }}</div>
                      <div class="emp-email">{{ emp.email }}</div>
                    </div>
                  </div>
                </td>
                <td><span class="id-tag">{{ emp.employeeId }}</span></td>
                <td>{{ emp.departmentName }}</td>
                <td>{{ emp.designation }}</td>
                <td>
                  <div class="phone-text">{{ emp.phone }}</div>
                </td>
                <td>{{ emp.joiningDate }}</td>
                <td>
                  <strong>₹{{ emp.salary.toLocaleString('en-IN') }}</strong>
                </td>
                <td>
                  <app-badge [text]="emp.employmentStatus"></app-badge>
                </td>
                <td>
                  <div class="actions-cell">
                    <button type="button" class="btn-action" title="View Profile Details" (click)="viewDetails(emp.employeeId)">
                      <app-icon name="eye" [size]="15"></app-icon>
                    </button>
                    <button type="button" class="btn-action edit" title="Edit Employee" (click)="openEditModal(emp)" *ngIf="canManage">
                      <app-icon name="edit" [size]="15"></app-icon>
                    </button>
                    <button type="button" class="btn-action delete" title="Delete Employee" (click)="confirmDelete(emp)" *ngIf="canManage">
                      <app-icon name="trash" [size]="15"></app-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <app-empty-state
          *ngIf="filteredEmployees.length === 0"
          icon="users"
          title="No employees found"
          description="No employee records match the search criteria or selected filters."
          actionLabel="Clear Filters"
          [showAddIcon]="false"
          (actionClicked)="clearFilters()"
        ></app-empty-state>

        <!-- Pagination -->
        <app-pagination
          [totalItems]="filteredEmployees.length"
          [pageSize]="pageSize"
          [currentPage]="currentPage"
          (pageChanged)="currentPage = $event"
        ></app-pagination>
      </div>

      <!-- Add/Edit Employee Modal -->
      <app-modal
        [isOpen]="showModal"
        [title]="editingEmployeeId ? 'Edit Employee Details' : 'Register New Employee'"
        subtitle="Ensure personal, compensation, and department information is accurately specified."
        size="lg"
        (closed)="closeModal()"
      >
        <form [formGroup]="empForm" (ngSubmit)="saveEmployee()" class="emp-modal-form">
          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label required">Full Name</label>
              <input type="text" formControlName="fullName" class="form-control" placeholder="e.g. Rahul Sharma" />
            </div>

            <div class="form-group">
              <label class="form-label required">Work Email</label>
              <input type="email" formControlName="email" class="form-control" placeholder="r.sharma@erp.com" />
            </div>
          </div>

          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label required">Phone Number</label>
              <input type="text" formControlName="phone" class="form-control" placeholder="+91 98765 43210" />
            </div>

            <div class="form-group">
              <label class="form-label required">Gender</label>
              <select formControlName="gender" class="form-select">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label required">Department</label>
              <select formControlName="departmentName" class="form-select">
                <option *ngFor="let dept of deptService.departments()" [value]="dept.name">
                  {{ dept.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Designation / Job Role</label>
              <input type="text" formControlName="designation" class="form-control" placeholder="e.g. Lead Software Architect" />
            </div>
          </div>

          <div class="grid-cols-3">
            <div class="form-group">
              <label class="form-label required">Joining Date</label>
              <input type="date" formControlName="joiningDate" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label required">Monthly Salary (₹)</label>
              <input type="number" formControlName="salary" class="form-control" placeholder="85000" min="1000" />
            </div>

            <div class="form-group">
              <label class="form-label required">Employment Status</label>
              <select formControlName="employmentStatus" class="form-select">
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Probation">Probation</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Avatar Image URL (Optional)</label>
            <input type="url" formControlName="avatar" class="form-control" placeholder="https://..." />
          </div>

          <div class="form-group">
            <label class="form-label required">Residential Address</label>
            <textarea formControlName="address" class="form-control" rows="2" placeholder="Street, Building, City, State"></textarea>
          </div>

          <div modal-footer>
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="empForm.invalid">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ editingEmployeeId ? 'Save Changes' : 'Create Employee Profile' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Confirm Employee Profile Deletion"
        [message]="'Are you sure you want to permanently delete ' + (selectedEmployee?.fullName || 'this employee') + ' (' + (selectedEmployee?.employeeId || '') + ')?'"
        confirmText="Delete Profile"
        variant="danger"
        (confirmed)="deleteConfirmed()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .employee-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .table-card {
      padding: 0;
      overflow: hidden;
    }
    .emp-profile-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .emp-thumb {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }
    .emp-name {
      font-weight: 600;
      color: var(--erp-text-heading);
    }
    .emp-email {
      font-size: 0.775rem;
      color: var(--erp-text-muted);
    }
    .id-tag {
      font-family: var(--erp-font-mono);
      font-size: 0.8rem;
      font-weight: 600;
      background: var(--erp-bg-subtle);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .phone-text {
      font-size: 0.825rem;
      color: var(--erp-text-muted);
    }
    .actions-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }
    .btn-action {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid var(--erp-border);
      background: var(--erp-card-bg);
      color: var(--erp-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-action:hover {
      background: var(--erp-bg-hover);
      color: var(--erp-primary);
    }
    .btn-action.edit:hover {
      color: #2563eb;
      border-color: #93c5fd;
    }
    .btn-action.delete:hover {
      color: #dc2626;
      border-color: #fca5a5;
      background: #fef2f2;
    }
    .text-right {
      text-align: right;
    }
    .emp-modal-form .grid-cols-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    .emp-modal-form .grid-cols-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    @media (max-width: 600px) {
      .emp-modal-form .grid-cols-2,
      .emp-modal-form .grid-cols-3 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EmployeeListComponent implements OnInit {
  employeeService = inject(EmployeeService);
  deptService = inject(DepartmentService);
  auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if ((params['action'] === 'register' || params['action'] === 'new') && this.canManage) {
        setTimeout(() => this.openAddModal(), 100);
      }
    });
  }

  defaultAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" fill="%23EFF6FF"/><circle cx="20" cy="16" r="8" fill="%232563EB"/><path d="M8 34C8 27.3726 13.3726 22 20 22C26.6274 22 32 27.3726 32 34" stroke="%232563EB" stroke-width="2.5" stroke-linecap="round"/></svg>';

  searchQuery = '';
  selectedDept = 'All';
  selectedStatus = 'All';
  selectedSort = 'name_asc';

  currentPage = 1;
  pageSize = 8;

  showModal = false;
  editingEmployeeId: string | null = null;
  showDeleteConfirm = false;
  selectedEmployee: Employee | null = null;

  empForm: FormGroup;

  get canManage(): boolean {
    return this.auth.hasRole(['Admin', 'HR Manager']);
  }

  constructor() {
    this.empForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      gender: ['Male', Validators.required],
      departmentName: ['Human Resources', Validators.required],
      designation: ['', Validators.required],
      joiningDate: [new Date().toISOString().split('T')[0], Validators.required],
      salary: [75000, [Validators.required, Validators.min(1000)]],
      employmentStatus: ['Full-time', Validators.required],
      avatar: [''],
      address: ['', Validators.required]
    });
  }

  get filteredEmployees(): Employee[] {
    let list = this.employeeService.employees();

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(e =>
        e.fullName.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
      );
    }

    // Filter dept
    if (this.selectedDept !== 'All') {
      list = list.filter(e => e.departmentName === this.selectedDept);
    }

    // Filter status
    if (this.selectedStatus !== 'All') {
      list = list.filter(e => e.employmentStatus === this.selectedStatus);
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (this.selectedSort) {
        case 'name_asc': return a.fullName.localeCompare(b.fullName);
        case 'name_desc': return b.fullName.localeCompare(a.fullName);
        case 'salary_desc': return b.salary - a.salary;
        case 'salary_asc': return a.salary - b.salary;
        case 'date_desc': return b.joiningDate.localeCompare(a.joiningDate);
        default: return 0;
      }
    });

    return list;
  }

  get pagedEmployees(): Employee[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEmployees.slice(start, start + this.pageSize);
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.currentPage = 1;
  }

  onDeptFilter(event: Event): void {
    this.selectedDept = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
  }

  onStatusFilter(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
  }

  onSortChange(event: Event): void {
    this.selectedSort = (event.target as HTMLSelectElement).value;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedDept = 'All';
    this.selectedStatus = 'All';
    this.selectedSort = 'name_asc';
    this.currentPage = 1;
  }

  viewDetails(empId: string): void {
    this.router.navigate(['/hr/employees', empId]);
  }

  openAddModal(): void {
    this.editingEmployeeId = null;
    this.empForm.reset({
      fullName: '',
      email: '',
      phone: '+91 ',
      gender: 'Male',
      departmentName: this.deptService.departments()[0]?.name || 'Human Resources',
      designation: '',
      joiningDate: new Date().toISOString().split('T')[0],
      salary: 75000,
      employmentStatus: 'Full-time',
      avatar: '',
      address: ''
    });
    this.showModal = true;
  }

  openEditModal(emp: Employee): void {
    this.editingEmployeeId = emp.id;
    this.empForm.patchValue({
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      gender: emp.gender,
      departmentName: emp.departmentName,
      designation: emp.designation,
      joiningDate: emp.joiningDate,
      salary: emp.salary,
      employmentStatus: emp.employmentStatus,
      avatar: emp.avatar,
      address: emp.address
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingEmployeeId = null;
  }

  saveEmployee(): void {
    if (this.empForm.invalid) return;

    const val = this.empForm.value;
    const dept = this.deptService.departments().find(d => d.name === val.departmentName);
    const departmentId = dept?.id || 'dept-1';

    if (this.editingEmployeeId) {
      const existing = this.employeeService.employees().find(e => e.id === this.editingEmployeeId);
      this.employeeService.updateEmployee(this.editingEmployeeId, {
        fullName: val.fullName,
        email: val.email,
        phone: val.phone,
        gender: val.gender,
        departmentId,
        departmentName: val.departmentName,
        designation: val.designation,
        joiningDate: val.joiningDate,
        salary: Number(val.salary),
        employmentStatus: val.employmentStatus,
        avatar: val.avatar || existing?.avatar || this.defaultAvatar,
        address: val.address,
        professionalGoal: existing?.professionalGoal,
        education: existing?.education,
        currentEducation: existing?.currentEducation,
        university: existing?.university
      });
    } else {
      this.employeeService.addEmployee({
        fullName: val.fullName,
        email: val.email,
        phone: val.phone,
        gender: val.gender,
        departmentId,
        departmentName: val.departmentName,
        designation: val.designation,
        joiningDate: val.joiningDate,
        salary: Number(val.salary),
        employmentStatus: val.employmentStatus,
        avatar: val.avatar || this.defaultAvatar,
        address: val.address,
        casualLeaveBalance: 12,
        sickLeaveBalance: 10,
        earnedLeaveBalance: 15,
        unpaidLeaveTaken: 0,
        attendancePresentDays: 24,
        attendanceTotalDays: 24
      });
    }

    this.closeModal();
  }

  confirmDelete(emp: Employee): void {
    this.selectedEmployee = emp;
    this.showDeleteConfirm = true;
  }

  deleteConfirmed(): void {
    if (this.selectedEmployee) {
      this.employeeService.deleteEmployee(this.selectedEmployee.id);
      this.showDeleteConfirm = false;
      this.selectedEmployee = null;
    }
  }

  onAvatarError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target.src !== this.defaultAvatar) {
      target.src = this.defaultAvatar;
    }
  }
}

