import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { DemoDataService } from './demo-data.service';
import { EmployeeService } from './employee.service';
import { NotificationService } from './notification.service';
import { LeaveRequest, LeaveStatus, LeaveType } from '../models/erp.model';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private readonly KEY = 'erp_leaves';
  leaveRequests = signal<LeaveRequest[]>([]);

  pendingLeavesCount = computed(() => {
    return this.leaveRequests().filter(l => l.status === 'Pending').length;
  });

  approvedLeavesCount = computed(() => {
    return this.leaveRequests().filter(l => l.status === 'Approved').length;
  });

  rejectedLeavesCount = computed(() => {
    return this.leaveRequests().filter(l => l.status === 'Rejected').length;
  });

  constructor(
    private storage: StorageService,
    private demoData: DemoDataService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService
  ) {
    this.loadLeaves();
  }

  private loadLeaves(): void {
    const data = this.storage.getItem<LeaveRequest[]>(this.KEY, this.demoData.getDemoLeaveRequests());
    this.leaveRequests.set(data);
  }

  private save(data: LeaveRequest[]): void {
    this.leaveRequests.set(data);
    this.storage.setItem(this.KEY, data);
  }

  getLeavesByEmployee(empId: string): LeaveRequest[] {
    return this.leaveRequests().filter(l => l.employeeId === empId);
  }

  calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return 0;
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    return diffDays;
  }

  hasOverlap(employeeId: string, startDate: string, endDate: string, excludeId?: string): boolean {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return this.leaveRequests().some(l => {
      if (l.id === excludeId) return false;
      if (l.employeeId !== employeeId) return false;
      if (l.status === 'Rejected') return false; // Rejected leaves don't block
      const lStart = new Date(l.startDate).getTime();
      const lEnd = new Date(l.endDate).getTime();
      // Overlap condition: max(start1, start2) <= min(end1, end2)
      return Math.max(start, lStart) <= Math.min(end, lEnd);
    });
  }

  applyLeave(application: {
    employeeId: string;
    employeeName: string;
    departmentName: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }): { success: boolean; message: string; leave?: LeaveRequest } {
    if (!application.startDate || !application.endDate) {
      return { success: false, message: 'Please select valid start and end dates.' };
    }

    const start = new Date(application.startDate);
    const end = new Date(application.endDate);

    if (end < start) {
      return { success: false, message: 'End date cannot be earlier than start date.' };
    }

    const days = this.calculateDays(application.startDate, application.endDate);
    if (days <= 0) {
      return { success: false, message: 'Invalid leave duration.' };
    }

    if (this.hasOverlap(application.employeeId, application.startDate, application.endDate)) {
      return { success: false, message: 'You already have a pending or approved leave overlapping with these dates.' };
    }

    const employee = this.employeeService.getEmployeeById(application.employeeId);
    if (!employee) {
      return { success: false, message: 'Employee not found.' };
    }

    // Check balance for paid leaves
    if (application.leaveType === 'Casual Leave' && employee.casualLeaveBalance < days) {
      return {
        success: false,
        message: `Insufficient casual leave balance. Available: ${employee.casualLeaveBalance} days, Requested: ${days} days.`
      };
    }
    if (application.leaveType === 'Sick Leave' && employee.sickLeaveBalance < days) {
      return {
        success: false,
        message: `Insufficient sick leave balance. Available: ${employee.sickLeaveBalance} days, Requested: ${days} days.`
      };
    }
    if (application.leaveType === 'Earned Leave' && employee.earnedLeaveBalance < days) {
      return {
        success: false,
        message: `Insufficient earned leave balance. Available: ${employee.earnedLeaveBalance} days, Requested: ${days} days.`
      };
    }

    const list = this.leaveRequests();
    const nextNum = 5000 + list.length + 1;
    const today = new Date().toISOString().split('T')[0];

    const newLeave: LeaveRequest = {
      id: 'lr-' + Date.now(),
      requestId: `LR-${nextNum}`,
      employeeId: application.employeeId,
      employeeName: application.employeeName,
      departmentName: application.departmentName,
      leaveType: application.leaveType,
      startDate: application.startDate,
      endDate: application.endDate,
      days,
      reason: application.reason,
      status: 'Pending',
      appliedDate: today
    };

    this.save([newLeave, ...list]);

    this.notificationService.notify(
      'New Leave Request',
      `${application.employeeName} submitted a ${days}-day ${application.leaveType} request.`,
      'info',
      '/hr/leave'
    );

    return { success: true, message: 'Leave application submitted successfully.', leave: newLeave };
  }

  approveLeave(id: string, reviewerName: string, comments = 'Approved by HR'): { success: boolean; message: string } {
    let leaveToUpdate: LeaveRequest | undefined;
    const updated = this.leaveRequests().map(l => {
      if (l.id === id) {
        leaveToUpdate = {
          ...l,
          status: 'Approved' as LeaveStatus,
          reviewedBy: reviewerName,
          reviewedDate: new Date().toISOString().split('T')[0],
          comments
        };
        return leaveToUpdate;
      }
      return l;
    });

    if (leaveToUpdate) {
      this.save(updated);
      // Automatically deduct leave days from employee balance
      this.employeeService.deductLeaveDays(leaveToUpdate.employeeId, leaveToUpdate.leaveType, leaveToUpdate.days);

      this.notificationService.notify(
        'Leave Approved',
        `Leave request ${leaveToUpdate.requestId} for ${leaveToUpdate.employeeName} (${leaveToUpdate.days} days) has been approved.`,
        'success',
        '/hr/leave'
      );
      return { success: true, message: 'Leave request approved and employee balance updated.' };
    }
    return { success: false, message: 'Leave request not found.' };
  }

  rejectLeave(id: string, reviewerName: string, comments: string): { success: boolean; message: string } {
    let leaveToUpdate: LeaveRequest | undefined;
    const updated = this.leaveRequests().map(l => {
      if (l.id === id) {
        leaveToUpdate = {
          ...l,
          status: 'Rejected' as LeaveStatus,
          reviewedBy: reviewerName,
          reviewedDate: new Date().toISOString().split('T')[0],
          comments: comments || 'Rejected by HR'
        };
        return leaveToUpdate;
      }
      return l;
    });

    if (leaveToUpdate) {
      this.save(updated);
      this.notificationService.notify(
        'Leave Rejected',
        `Leave request ${leaveToUpdate.requestId} for ${leaveToUpdate.employeeName} was rejected.`,
        'warning',
        '/hr/leave'
      );
      return { success: true, message: 'Leave request rejected.' };
    }
    return { success: false, message: 'Leave request not found.' };
  }

  resetDemo(): void {
    this.save(this.demoData.getDemoLeaveRequests());
  }
}

