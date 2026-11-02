import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { DemoDataService } from './demo-data.service';
import { Department } from '../models/erp.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly KEY = 'erp_departments';
  departments = signal<Department[]>([]);

  constructor(
    private storage: StorageService,
    private demoData: DemoDataService
  ) {
    this.loadDepartments();
  }

  private loadDepartments(): void {
    const data = this.storage.getItem<Department[]>(this.KEY, this.demoData.getDemoDepartments());
    this.departments.set(data);
  }

  private save(data: Department[]): void {
    this.departments.set(data);
    this.storage.setItem(this.KEY, data);
  }

  getDepartmentById(id: string): Department | undefined {
    return this.departments().find(d => d.id === id || d.departmentId === id);
  }

  addDepartment(dept: Omit<Department, 'id' | 'departmentId' | 'employeeCount'>): Department {
    const list = this.departments();
    const nextNum = list.length + 101;
    const newDept: Department = {
      ...dept,
      id: 'dept-' + Date.now(),
      departmentId: `DEP-${nextNum}`,
      employeeCount: 0
    };
    this.save([...list, newDept]);
    return newDept;
  }

  updateDepartment(id: string, updates: Partial<Department>): Department | null {
    let target: Department | null = null;
    const updated = this.departments().map(d => {
      if (d.id === id) {
        target = { ...d, ...updates };
        return target;
      }
      return d;
    });
    if (target) {
      this.save(updated);
    }
    return target;
  }

  updateEmployeeCount(departmentIdOrName: string, count: number): void {
    const updated = this.departments().map(d => {
      if (d.id === departmentIdOrName || d.name === departmentIdOrName) {
        return { ...d, employeeCount: count };
      }
      return d;
    });
    this.save(updated);
  }

  deleteDepartment(id: string, assignedEmployeeCount: number): { success: boolean; message: string } {
    if (assignedEmployeeCount > 0) {
      return {
        success: false,
        message: `Cannot delete department: ${assignedEmployeeCount} employee(s) are actively assigned. Reassign them before deleting.`
      };
    }
    const filtered = this.departments().filter(d => d.id !== id);
    this.save(filtered);
    return { success: true, message: 'Department removed successfully.' };
  }

  resetDemo(): void {
    this.save(this.demoData.getDemoDepartments());
  }
}

