import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '../../../core/services/department.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { AuthService } from '../../../core/services/auth.service';
import { Department, Employee } from '../../../core/models/erp.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-department-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, ModalComponent, ConfirmDialogComponent],
  template: `
    <div class="dept-page">
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">Department & Business Units</h2>
          <p class="erp-card-subtitle">Manage corporate departmental structures, designated department heads, and workforce allocations</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openAddModal()" *ngIf="canManage">
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Add Department</span>
        </button>
      </div>

      <!-- Validation / Notice Alert -->
      <div class="alert-box alert-error" *ngIf="errorMessage">
        <app-icon name="alert-circle" [size]="18"></app-icon>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Department Cards Grid -->
      <div class="grid-cols-3">
        <div class="erp-card dept-card" *ngFor="let dept of deptService.departments(); trackBy: trackById">
          <div class="dept-card-top">
            <div class="dept-badge">{{ dept.departmentId }}</div>
            <div class="dept-actions" *ngIf="canManage">
              <button type="button" class="icon-btn-sm" (click)="openEditModal(dept)" title="Edit">
                <app-icon name="edit" [size]="14"></app-icon>
              </button>
              <button type="button" class="icon-btn-sm text-danger" (click)="confirmDelete(dept)" title="Delete">
                <app-icon name="trash" [size]="14"></app-icon>
              </button>
            </div>
          </div>

          <h3 class="dept-title">{{ dept.name }}</h3>
          <p class="dept-desc">{{ dept.description }}</p>

          <div class="dept-meta">
            <div class="meta-row">
              <span class="meta-label">Department Head:</span>
              <span class="meta-val">{{ dept.headEmployeeName }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Assigned Workforce:</span>
              <span class="headcount-tag">{{ dept.employeeCount }} Employees</span>
            </div>
          </div>

          <div class="dept-footer">
            <button type="button" class="btn btn-secondary btn-sm w-100" (click)="viewEmployees(dept)">
              <app-icon name="users" [size]="14"></app-icon>
              <span>View Department Employees</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <app-modal
        [isOpen]="showModal"
        [title]="editingDeptId ? 'Edit Department' : 'Create New Department'"
        subtitle="Specify unit designation, leadership head, and functional scope."
        size="md"
        (closed)="closeModal()"
      >
        <form [formGroup]="deptForm" (ngSubmit)="saveDepartment()">
          <div class="form-group">
            <label class="form-label required">Department Name</label>
            <input type="text" formControlName="name" class="form-control" placeholder="e.g. Legal & Compliance" />
          </div>

          <div class="form-group">
            <label class="form-label required">Department Head / Manager</label>
            <select formControlName="headEmployeeName" class="form-select">
              <option *ngFor="let emp of employeeService.employees(); trackBy: trackById" [value]="emp.fullName">
                {{ emp.fullName }} ({{ emp.designation }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Department Scope & Description</label>
            <textarea formControlName="description" class="form-control" rows="3" placeholder="Core functions and responsibilities"></textarea>
          </div>

          <div modal-footer>
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="deptForm.invalid">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ editingDeptId ? 'Update Department' : 'Create Department' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- View Department Employees Modal -->
      <app-modal
        [isOpen]="showEmployeesModal"
        [title]="selectedDept ? selectedDept.name + ' — Assigned Employees' : 'Employees'"
        [subtitle]="'Total ' + selectedDeptEmployees.length + ' active employees in this unit'"
        size="lg"
        [showFooter]="false"
        (closed)="showEmployeesModal = false"
      >
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Designation</th>
                <th>Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of selectedDeptEmployees; trackBy: trackById">
                <td>
                  <strong>{{ emp.fullName }}</strong> ({{ emp.employeeId }})
                </td>
                <td>{{ emp.designation }}</td>
                <td>{{ emp.phone }} &bull; {{ emp.email }}</td>
                <td><span class="badge">{{ emp.employmentStatus }}</span></td>
              </tr>
              <tr *ngIf="selectedDeptEmployees.length === 0">
                <td colspan="4" class="text-center py-4">No employees currently assigned to this department.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-modal>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Confirm Department Deletion"
        [message]="deleteMessage"
        confirmText="Confirm Delete"
        variant="danger"
        (confirmed)="deleteConfirmed()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .dept-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .alert-box {
      padding: 12px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
    }
    .alert-error {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #991b1b;
    }
    .dept-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    .dept-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .dept-badge {
      font-family: var(--erp-font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--erp-primary);
      background: var(--erp-primary-light);
      padding: 3px 8px;
      border-radius: 6px;
    }
    .dept-actions {
      display: flex;
      gap: 6px;
    }
    .icon-btn-sm {
      background: none;
      border: 1px solid var(--erp-border);
      border-radius: 6px;
      padding: 4px;
      cursor: pointer;
      color: var(--erp-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-btn-sm:hover {
      background: var(--erp-bg-hover);
      color: var(--erp-text-heading);
    }
    .text-danger:hover {
      color: #dc2626 !important;
      background: #fee2e2 !important;
    }
    .dept-title {
      font-size: 1.15rem;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--erp-text-heading);
    }
    .dept-desc {
      font-size: 0.825rem;
      color: var(--erp-text-muted);
      line-height: 1.45;
      margin-bottom: 16px;
      flex: 1;
    }
    .dept-meta {
      background: var(--erp-bg-subtle);
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
    }
    .meta-label {
      color: var(--erp-text-muted);
    }
    .meta-val {
      font-weight: 600;
      color: var(--erp-text-heading);
    }
    .headcount-tag {
      font-weight: 700;
      color: var(--erp-primary);
    }
    .w-100 {
      width: 100%;
    }
  `]
})
export class DepartmentListComponent {
  deptService = inject(DepartmentService);
  employeeService = inject(EmployeeService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  showModal = false;
  editingDeptId: string | null = null;
  showEmployeesModal = false;
  selectedDept: Department | null = null;
  selectedDeptEmployees: Employee[] = [];

  showDeleteConfirm = false;
  deptToDelete: Department | null = null;
  deleteMessage = '';
  errorMessage = '';

  deptForm: FormGroup;

  get canManage(): boolean {
    return this.auth.hasRole(['Admin', 'HR Manager']);
  }

  trackById(index: number, item: any): string {
    return item?.id || item?.departmentId || item?.employeeId || index.toString();
  }

  constructor() {
    this.deptForm = this.fb.group({
      name: ['', Validators.required],
      headEmployeeName: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  openAddModal(): void {
    this.editingDeptId = null;
    const firstEmp = this.employeeService.employees()[0]?.fullName || '';
    this.deptForm.reset({
      name: '',
      headEmployeeName: firstEmp,
      description: ''
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(dept: Department): void {
    this.editingDeptId = dept.id;
    this.deptForm.patchValue({
      name: dept.name,
      headEmployeeName: dept.headEmployeeName,
      description: dept.description
    });
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingDeptId = null;
  }

  saveDepartment(): void {
    if (this.deptForm.invalid) return;
    const val = this.deptForm.value;

    const headEmp = this.employeeService.employees().find(e => e.fullName === val.headEmployeeName);
    const headEmployeeId = headEmp?.employeeId || 'EMP-1001';

    if (this.editingDeptId) {
      this.deptService.updateDepartment(this.editingDeptId, {
        name: val.name,
        headEmployeeId,
        headEmployeeName: val.headEmployeeName,
        description: val.description
      });
    } else {
      this.deptService.addDepartment({
        name: val.name,
        headEmployeeId,
        headEmployeeName: val.headEmployeeName,
        description: val.description
      });
    }

    this.closeModal();
  }

  viewEmployees(dept: Department): void {
    this.selectedDept = dept;
    this.selectedDeptEmployees = this.employeeService.getEmployeesByDepartment(dept.name);
    this.showEmployeesModal = true;
  }

  confirmDelete(dept: Department): void {
    const assignedCount = this.employeeService.getEmployeesByDepartment(dept.name).length;
    if (assignedCount > 0) {
      this.errorMessage = `Cannot delete "${dept.name}": ${assignedCount} employee(s) are actively assigned to it. Reassign employees first.`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.deptToDelete = dept;
    this.deleteMessage = `Are you sure you want to delete ${dept.name} (${dept.departmentId})?`;
    this.showDeleteConfirm = true;
    this.errorMessage = '';
  }

  deleteConfirmed(): void {
    if (this.deptToDelete) {
      const res = this.deptService.deleteDepartment(this.deptToDelete.id, 0);
      if (!res.success) {
        this.errorMessage = res.message;
      }
      this.showDeleteConfirm = false;
      this.deptToDelete = null;
    }
  }
}

