export type UserRole =
  | 'Admin'
  | 'HR Manager'
  | 'Inventory Manager'
  | 'Sales Manager'
  | 'Finance Manager'
  | 'Employee';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  employeeId?: string;
  department?: string;
  avatar?: string;
  designation?: string;
}

export type EmploymentStatus = 'Full-time' | 'Part-time' | 'Contract' | 'Probation' | 'Terminated';
export type Gender = 'Male' | 'Female' | 'Other';

export interface Employee {
  id: string;
  employeeId: string; // e.g., 'EMP-1001'
  fullName: string;
  avatar: string;
  email: string;
  phone: string;
  gender: Gender;
  departmentId: string;
  departmentName: string;
  designation: string;
  professionalGoal?: string;
  education?: string;
  currentEducation?: string;
  university?: string;
  joiningDate: string; // YYYY-MM-DD
  salary: number;
  employmentStatus: EmploymentStatus;
  address: string;
  // Leave balances
  casualLeaveBalance: number;
  sickLeaveBalance: number;
  earnedLeaveBalance: number;
  unpaidLeaveTaken: number;
  // Attendance summary
  attendancePresentDays: number;
  attendanceTotalDays: number;
}

export interface Department {
  id: string;
  departmentId: string; // 'DEP-101'
  name: string;
  headEmployeeId: string;
  headEmployeeName: string;
  employeeCount: number;
  description: string;
}

export type LeaveType =
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Earned Leave'
  | 'Unpaid Leave'
  | 'Maternity/Paternity Leave';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  requestId: string; // 'LR-5001'
  employeeId: string;
  employeeName: string;
  departmentName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  comments?: string;
}

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface Product {
  id: string;
  productId: string; // 'PRD-2001'
  name: string;
  sku: string;
  category: string;
  description: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  availableQuantity: number;
  minimumStockLevel: number;
  warehouse: string;
  supplierId: string;
  supplierName: string;
  status: StockStatus;
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  movementId: string; // 'SM-4001'
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantity: number;
  referenceType: 'PURCHASE_RECEIPT' | 'SALES_FULFILLMENT' | 'MANUAL_ADJUSTMENT' | 'SALES_CANCELLATION' | 'INITIAL_STOCK';
  referenceId: string;
  date: string;
  performedBy: string;
  notes: string;
}

export interface Supplier {
  id: string;
  supplierId: string; // 'SUP-3001'
  supplierName: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  suppliedProducts: string[];
  status: 'Active' | 'Inactive';
}

export type PurchaseOrderStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Ordered'
  | 'Partially Received'
  | 'Received'
  | 'Cancelled';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // 'PO-7001'
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxRate: number; // e.g. 18 for 18%
  taxAmount: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  createdBy: string;
  approvedBy?: string;
  notes?: string;
}

export type SalesOrderStatus =
  | 'Draft'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface SalesOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // 'SO-8001'
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  orderDate: string;
  deliveryDate: string;
  items: SalesOrderItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number; // e.g., 18 for 18% GST
  taxAmount: number;
  totalAmount: number;
  salesStatus: SalesOrderStatus;
  paymentStatus: PaymentStatus;
  invoiceGenerated: boolean;
  invoiceId?: string;
  stockDeducted: boolean;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PaymentRecord {
  id: string;
  paymentId: string; // 'PAY-1001'
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Cheque' | 'UPI';
  transactionReference: string;
  recordedBy: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // 'INV-9001'
  salesOrderId: string;
  salesOrderNumber: string;
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  customerPhone?: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  gst: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: PaymentStatus;
  payments: PaymentRecord[];
  notes?: string;
}

export type ExpenseCategory =
  | 'Office Supplies'
  | 'Utilities'
  | 'Rent & Lease'
  | 'Salaries'
  | 'Marketing'
  | 'Travel & Logistics'
  | 'Software Licenses'
  | 'Maintenance';

export interface Expense {
  id: string;
  expenseId: string; // 'EXP-6001'
  title: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod: 'Bank Transfer' | 'Corporate Card' | 'Cash' | 'UPI';
  status: 'Paid' | 'Pending';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  date: string;
  read: boolean;
  link?: string;
}

export interface WorkflowStep {
  id: string;
  module: 'HR' | 'Procurement' | 'Sales' | 'Finance';
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'rejected';
  timestamp: string;
  actor: string;
  referenceId: string;
}
