import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { DemoDataService } from './demo-data.service';
import { DepartmentService } from './department.service';
import { Employee, EmploymentStatus } from '../models/erp.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly KEY = 'erp_employees';
  employees = signal<Employee[]>([]);

  totalEmployees = computed(() => this.employees().length);
  activeEmployees = computed(() => {
    return this.employees().filter(e => e.employmentStatus !== 'Terminated').length;
  });

  constructor(
    private storage: StorageService,
    private demoData: DemoDataService,
    private deptService: DepartmentService
  ) {
    this.loadEmployees();
  }

  private loadEmployees(): void {
    let data = this.storage.getItem<Employee[]>(this.KEY, this.demoData.getDemoEmployees());
    const demoEmployees = this.demoData.getDemoEmployees();
    let hasChanges = false;

    // Remove any legacy unsplash URLs and ensure all employees have offline vector avatars
    data = data.map(emp => {
      if (!emp.avatar || emp.avatar.includes('unsplash') || emp.avatar.startsWith('/assets')) {
        const demo = demoEmployees.find(d => d.employeeId === emp.employeeId);
        if (demo) {
          hasChanges = true;
          return { ...emp, avatar: demo.avatar };
        }
      }
      return emp;
    });

    const demoEmp1001 = demoEmployees.find(e => e.employeeId === 'EMP-1001');
    if (demoEmp1001) {
      const idx = data.findIndex(e => e.employeeId === 'EMP-1001');
      if (idx !== -1) {
        if (!data[idx].location || !data[idx].careerInterest || data[idx].avatar.includes('unsplash') || data[idx].avatar.startsWith('/assets')) {
          data[idx] = {
            ...data[idx],
            avatar: demoEmp1001.avatar,
            location: data[idx].location || demoEmp1001.location,
            careerInterest: data[idx].careerInterest || demoEmp1001.careerInterest,
            professionalGoal: data[idx].professionalGoal || demoEmp1001.professionalGoal,
            education: data[idx].education || demoEmp1001.education,
            currentEducation: data[idx].currentEducation || demoEmp1001.currentEducation,
            university: data[idx].university || demoEmp1001.university
          };
          hasChanges = true;
        }
      } else {
        data.unshift(demoEmp1001);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.storage.setItem(this.KEY, data);
    }
    this.employees.set(data);
    this.syncDepartmentCounts(data);
  }

  updateProfile(employeeId: string, updates: Partial<Employee>): Employee | null {
    return this.updateEmployee(employeeId, updates);
  }

  private save(data: Employee[]): void {
    this.employees.set(data);
    this.storage.setItem(this.KEY, data);
    this.syncDepartmentCounts(data);
  }

  private syncDepartmentCounts(employees: Employee[]): void {
    const counts: { [deptName: string]: number } = {};
    employees.forEach(e => {
      if (e.employmentStatus !== 'Terminated') {
        counts[e.departmentName] = (counts[e.departmentName] || 0) + 1;
      }
    });
    this.deptService.departments().forEach(dept => {
      const activeCount = counts[dept.name] || 0;
      if (dept.employeeCount !== activeCount) {
        this.deptService.updateEmployeeCount(dept.id, activeCount);
      }
    });
  }

  getEmployeeById(id: string): Employee | undefined {
    return this.employees().find(e => e.id === id || e.employeeId === id);
  }

  getEmployeesByDepartment(deptName: string): Employee[] {
    return this.employees().filter(e => e.departmentName === deptName);
  }

  addEmployee(emp: Omit<Employee, 'id' | 'employeeId'>): Employee {
    const list = this.employees();
    const nextIdNum = 1000 + list.length + 1;
    const newEmp: Employee = {
      ...emp,
      id: 'emp-' + Date.now(),
      employeeId: `EMP-${nextIdNum}`
    };
    this.save([...list, newEmp]);
    return newEmp;
  }

  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    let result: Employee | null = null;
    const updated = this.employees().map(e => {
      if (e.id === id || e.employeeId === id) {
        result = { ...e, ...updates };
        return result;
      }
      return e;
    });
    if (result) {
      this.save(updated);
    }
    return result;
  }

  deleteEmployee(id: string): { success: boolean; message: string } {
    const filtered = this.employees().filter(e => e.id !== id && e.employeeId !== id);
    this.save(filtered);
    return { success: true, message: 'Employee profile deleted successfully.' };
  }

  deductLeaveDays(empId: string, leaveType: string, days: number): void {
    const emp = this.getEmployeeById(empId);
    if (!emp) return;

    const updates: Partial<Employee> = {};
    if (leaveType === 'Casual Leave') {
      updates.casualLeaveBalance = Math.max(0, emp.casualLeaveBalance - days);
    } else if (leaveType === 'Sick Leave') {
      updates.sickLeaveBalance = Math.max(0, emp.sickLeaveBalance - days);
    } else if (leaveType === 'Earned Leave') {
      updates.earnedLeaveBalance = Math.max(0, emp.earnedLeaveBalance - days);
    } else {
      updates.unpaidLeaveTaken = (emp.unpaidLeaveTaken || 0) + days;
    }
    this.updateEmployee(emp.id, updates);
  }

  resetDemo(): void {
    this.save(this.demoData.getDemoEmployees());
  }
}

