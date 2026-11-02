# HCL Enterprise Resource Planning (ERP) Management System

> **HCL Final Project** — A complete, professional, fully functional Enterprise Resource Planning system built with Angular 22.

---

## 📋 Project Description

This is an integrated ERP Management System that enables organizations to manage their:

- **Employees, HR & Leave Management** (Module 1)
- **Inventory, Suppliers & Procurement** (Module 2)
- **Sales, Purchase Orders & Invoicing** (Module 3)
- **Finance Dashboard, Reports & Workflow Overview** (Module 4)

All four modules are fully interconnected — adding employees updates statistics, approving leave updates balances, creating purchase orders affects procurement records, receiving inventory increases stock, creating sales orders reduces stock when fulfilled, generating invoices updates outstanding payments, and recording payments updates finance statistics.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **Angular 22.2** | Frontend framework (standalone components) |
| **TypeScript 6.0** | Type-safe programming language |
| **HTML5** | Markup and templates |
| **SCSS** | Styling with CSS custom properties |
| **Angular Router** | Client-side navigation with guards |
| **Angular Reactive Forms** | Form handling with validation |
| **Angular Signals** | Reactive state management |
| **RxJS** | Reactive programming utilities |
| **Chart.js 4.6** | Dashboard charts and visualizations |
| **Browser LocalStorage** | Data persistence (no backend required) |

> **No backend server, database, or external API is used.** All business logic, data management, calculations, and functionality are implemented entirely within the Angular frontend. Node.js and npm are used only as development tools.

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** v18+ (v24 recommended)
- **npm** v9+ (v11 recommended)
- **Angular CLI** v22+ (installed as a dev dependency)

### Steps

```bash
# 1. Clone or navigate to the project directory
cd Chaitanya

# 2. Install dependencies
npm install

# 3. Start the development server
npm start

# 4. Open in browser
# Navigate to http://localhost:4200
```

### Build for Production

```bash
npm run build
```

The production bundle will be output to `dist/hcl-erp/`.

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** (Full Access) | `admin@erp.com` | `admin123` |
| **HR Manager** | `hr@erp.com` | `hr123` |
| **Inventory Manager** | `inventory@erp.com` | `inventory123` |
| **Sales Manager** | `sales@erp.com` | `sales123` |
| **Finance Manager** | `finance@erp.com` | `finance123` |
| **Employee** | `employee@erp.com` | `employee123` |

> **Note:** This is a frontend-only demonstration. LocalStorage-based authentication is not production-grade security. The login page includes quick-select buttons for each demo role.

---

## 📦 Project Modules

### Module 1: Employee, HR & Leave Management

**Employee Management:**
- Full CRUD operations (Add, Edit, Delete, View)
- Employee directory with search, filter by department/status, sort, and pagination
- Employee detail page with personal info, job info, salary, leave history, and attendance summary
- 16 seeded demo employees across 5 departments
- Profile image/avatar support

**Department Management:**
- Add, edit, delete departments
- View employees assigned to each department
- Prevents deletion of departments with active employees
- Auto-syncs employee count when employees are added/removed

**Leave Management:**
- Leave application with type selection (Casual, Sick, Earned, Unpaid, Maternity/Paternity)
- Automatic calculation of leave days (inclusive date range)
- Leave balance validation before application
- Overlap detection for conflicting date ranges
- HR Manager approve/reject workflow with comments
- Automatic deduction of leave balance upon approval
- Employee self-service view (own leave history)
- Pending/Approved/Rejected leave history tabs

### Module 2: Inventory, Suppliers & Procurement

**Inventory Management:**
- 20 seeded products across 8 categories
- Product CRUD with search, filter by category/stock status, sort
- Automatic stock status calculation (In Stock / Low Stock / Out of Stock)
- Low stock alerts when products fall below minimum threshold
- Stock movement tracking (IN, OUT, ADJUSTMENT)
- Purchase price and selling price tracking
- Warehouse assignment

**Supplier Management:**
- 8 seeded suppliers with company details and GST numbers
- Supplier CRUD operations
- View supplier's supplied products and purchase history
- Active/Inactive status management

**Procurement Management:**
- Create purchase requisitions with product line items
- Supplier selection and multi-product orders
- Automatic subtotal, tax (GST), and total calculation
- Full status workflow: Draft → Pending Approval → Approved → Ordered → Partially Received → Received → Cancelled
- **Goods Receipt:** Receive items with quantity validation
- Prevents receiving more items than outstanding purchase quantity
- Automatically increases inventory stock upon receipt
- Records stock movements for audit trail
- 10 seeded purchase orders in various statuses

### Module 3: Sales, Purchase Orders & Invoicing

**Sales Management:**
- Create sales orders with customer details and product line items
- Discount percentage and GST calculation
- Sales status workflow: Draft → Confirmed → Processing → Shipped → Delivered → Cancelled
- **Stock deduction** on order confirmation (prevents overselling)
- **Stock restoration** on order cancellation
- Prevents confirming orders that exceed available stock
- No double stock deductions when status changes
- Search, filter, and sort functionality
- 10 seeded sales orders

**Invoicing Management:**
- Generate invoices directly from sales orders
- **Duplicate prevention:** Cannot generate multiple invoices for same sales order
- Professional invoice template with company details, itemized products, GST breakdown
- Print invoice (browser print dialog)
- Download invoice as PDF (browser print-to-PDF)
- Payment recording with multiple payment methods (Bank Transfer, Credit Card, Cash, Cheque, UPI)
- Automatic payment status updates (Unpaid → Partially Paid → Paid)
- Overdue detection based on due date
- Prevents overpayment beyond outstanding balance
- Syncs payment status back to sales orders
- 10 seeded invoices with payment records

### Module 4: Finance Dashboard, Reports & Workflow Overview

**Finance Dashboard:**
- Total Revenue (cash-basis from collected payments)
- Total Expenses (operating + procurement)
- Net Profit calculation (Revenue - Expenses)
- Outstanding Payments
- Paid/Unpaid/Overdue invoice counts
- Monthly Revenue vs Expenses chart
- Monthly payroll obligation

**Expense Management:**
- Expense CRUD with categories (Office Supplies, Utilities, Rent, Salaries, Marketing, Travel, Software, Maintenance)
- Search, filter by category/date, and sort
- Total expense calculations
- 10 seeded expense records

**Financial Reports:**
1. **Sales Report** — Orders with revenue, tax, discounts
2. **Purchase Report** — Procurement orders with spend tracking
3. **Revenue Report** — Cash collections from invoice payments
4. **Expense Report** — Operating expenditures by category
5. **Profit & Loss Report** — Full P&L with revenue, COGS, operating expenses, net profit
6. **Outstanding Invoice Report** — Accounts receivable with overdue risk
7. **Inventory Valuation Report** — Stock valued at cost and selling price
8. **Employee Salary Report** — Payroll by department

All reports include:
- Date range filters
- Category/status filters
- Summary statistics
- Data tables
- **CSV export** (browser-based TypeScript download)
- **Print report** functionality

**Workflow Overview:**
- Visual workflow diagrams for all 4 modules:
  - HR: Employee Created → Leave Applied → HR Approval → Approved/Rejected
  - Procurement: Requisition → Approval → Purchase Order → Goods Received → Inventory Updated
  - Sales: Sales Order → Confirmation → Processing → Delivery → Invoice → Payment
  - Finance: Invoice Created → Payment Recorded → Revenue Updated → Report Updated
- Workflow status and pending action display

---

## 🎨 Application Design

- **Premium enterprise-level** dashboard inspired by SAP, Microsoft Dynamics, and modern SaaS admin panels
- Clean professional **light theme** with optional **dark mode** toggle
- Fixed sidebar with collapse/expand functionality
- Top navigation bar with role switcher, notifications, and profile menu
- Professional typography (Inter font family)
- Consistent spacing with rounded cards and subtle shadows
- Responsive layouts for desktop, tablet, and mobile
- Mobile-friendly navigation (sidebar becomes drawer)
- Print-optimized styles

**Color Palette:**
- Primary: `#2563EB`
- Secondary: `#0F172A`
- Background: `#F8FAFC`
- Success: `#16A34A`
- Warning: `#F59E0B`
- Danger: `#DC2626`

---

## 🔒 Role-Based Access Control

| Feature | Admin | HR Manager | Inventory Manager | Sales Manager | Finance Manager | Employee |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Employee Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Department Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Leave Management | ✅ | ✅ | ❌ | ❌ | ❌ | ✅* |
| Inventory | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Suppliers | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Procurement | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Sales Orders | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Invoices | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Finance Dashboard | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Expenses | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Workflows | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

*Employee role: Can apply for leave and view own leave history only.

Implementation: Angular route guards (`authGuard`, `roleGuard`) and permission checks in services/components. This is demo-level frontend access control, not secure server-side authorization.

---

## 🔔 Notifications

- In-app notification system with bell icon and unread count
- Automatic notifications for:
  - New leave requests and approvals/rejections
  - Low stock product alerts
  - Pending procurement approvals
  - Purchase order goods received
  - New sales orders
  - Invoice generation
  - Overdue invoices
  - Payments received
  - Role switches and data resets
- Mark individual or all notifications as read
- Click notification to navigate to relevant module

---

## ✅ Validation & Error Handling

- Required field validation on all forms
- Email format validation
- Phone number validation
- Positive quantity and price validation
- Valid date range validation (end date ≥ start date)
- Unique employee IDs, product SKUs, invoice numbers
- GST calculation validation (18% default)
- No negative inventory checks
- Duplicate invoice generation prevention
- Overpayment prevention
- Overlapping leave request detection
- Leave balance sufficiency checks
- Stock availability checks before order confirmation
- Goods receipt quantity validation (cannot exceed outstanding PO quantity)
- Meaningful error messages displayed to users
- Success notifications after CRUD operations
- Confirmation dialogs for destructive actions (delete, reset)
- Prevention of deleting records linked to active transactions

---

## 📁 Project Structure

```
src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts          # Authentication guard
│   │   └── role.guard.ts          # Role-based route guard
│   ├── models/
│   │   └── erp.model.ts           # All TypeScript interfaces & types
│   └── services/
│       ├── auth.service.ts         # Authentication & session
│       ├── demo-data.service.ts    # Seed data generator
│       ├── department.service.ts   # Department CRUD
│       ├── employee.service.ts     # Employee CRUD & leave balance
│       ├── expense.service.ts      # Expense CRUD
│       ├── finance.service.ts      # Financial computations
│       ├── inventory.service.ts    # Product & stock management
│       ├── invoice.service.ts      # Invoice generation & payments
│       ├── leave.service.ts        # Leave application & approval
│       ├── notification.service.ts # In-app notifications
│       ├── procurement.service.ts  # Purchase orders & goods receipt
│       ├── report.service.ts       # Report generation & CSV export
│       ├── sales.service.ts        # Sales orders & stock deduction
│       ├── storage.service.ts      # Centralized LocalStorage wrapper
│       └── supplier.service.ts     # Supplier CRUD
├── shared/
│   └── components/
│       ├── badge/                  # Status badge component
│       ├── chart/                  # Chart.js wrapper component
│       ├── confirm-dialog/         # Confirmation dialog
│       ├── empty-state/            # Empty state placeholder
│       ├── icon/                   # SVG icon component (30+ icons)
│       ├── modal/                  # Reusable modal dialog
│       ├── pagination/             # Table pagination
│       └── stat-card/              # Dashboard statistic card
├── layout/
│   ├── sidebar/                    # Fixed sidebar navigation
│   ├── header/                     # Top navigation bar
│   └── main-layout/               # Application shell layout
├── features/
│   ├── auth/
│   │   └── login/                  # Login page
│   ├── dashboard/                  # Main ERP dashboard
│   ├── hr/
│   │   ├── employees/              # Employee list & detail
│   │   ├── departments/            # Department management
│   │   └── leave/                  # Leave management
│   ├── inventory/
│   │   ├── products/               # Product inventory
│   │   ├── suppliers/              # Supplier management
│   │   ├── procurement/            # Purchase order management
│   │   └── movements/              # Stock movements log
│   ├── sales/
│   │   ├── orders/                 # Sales orders
│   │   └── invoices/               # Invoice management
│   └── finance/
│       ├── dashboard/              # Finance dashboard
│       ├── expenses/               # Expense management
│       ├── reports/                # Financial reports
│       └── workflows/              # Workflow overview
├── app.config.ts
├── app.routes.ts                   # All routes with guards
├── app.ts
├── app.html
└── app.scss
```

---

## 📊 Seeded Demo Data

| Entity | Count |
|---|---|
| Employees | 16 |
| Departments | 5 |
| Leave Requests | 5 |
| Products | 20 |
| Suppliers | 8 |
| Purchase Orders | 10 |
| Sales Orders | 10 |
| Invoices | 10 |
| Payment Records | 6 |
| Expenses | 10 |
| Stock Movements | 6 |
| Notifications | 5 |
| User Accounts | 6 |

Demo data is seeded automatically on first launch. A **Reset Demo Data** button (with confirmation dialog) is available in the header to restore all data to initial values.

---

## 📱 Responsive Design

The application is fully responsive across:
- **Desktop** (1200px+) — Full sidebar, 4-column grids
- **Laptop** (992px–1200px) — 2-column grids
- **Tablet** (768px–992px) — Collapsed sidebar, stacked layouts
- **Mobile** (< 768px) — Hidden sidebar, single-column, horizontal-scroll tables

---

## ⚠️ Limitations

This is a **frontend-only demonstration** application for the HCL Final Project:

1. **No Server-Side Authentication** — Login uses LocalStorage; not secure for production.
2. **No Database** — All data persists in the browser's LocalStorage only.
3. **Single Browser** — Data is not shared across browsers or devices.
4. **LocalStorage Limits** — Browser storage is typically limited to ~5–10 MB.
5. **No Real-Time Sync** — Multiple tabs may show stale data.
6. **No File Upload** — Avatar images use placeholder URLs; no actual file upload.
7. **No Email/SMS** — Notifications are in-app only; no email or SMS integration.
8. **No API Integration** — All data is self-contained within the browser.
9. **Demo-Level Access Control** — Role-based visibility is implemented in the frontend only; a production system would require server-side authorization.

---

## 👤 Author

**Chaitanya Santosh Wagh**
- B.Tech in Computer Science & Engineering (Pursuing)
- Sanjivani University
- Email: chaitanyawagh491@gmail.com

---

## 📄 License

This project is developed as an academic submission for the HCL Final Project evaluation.
