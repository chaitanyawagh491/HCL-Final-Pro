import { Injectable } from '@angular/core';
import { SalesService } from './sales.service';
import { ProcurementService } from './procurement.service';
import { InvoiceService } from './invoice.service';
import { ExpenseService } from './expense.service';
import { InventoryService } from './inventory.service';
import { EmployeeService } from './employee.service';
import { FinanceService } from './finance.service';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(
    private salesService: SalesService,
    private procurementService: ProcurementService,
    private invoiceService: InvoiceService,
    private expenseService: ExpenseService,
    private inventoryService: InventoryService,
    private employeeService: EmployeeService,
    private financeService: FinanceService
  ) {}

  getSalesReport(filter: ReportFilter = {}) {
    let orders = this.salesService.salesOrders();
    if (filter.startDate) orders = orders.filter(o => o.orderDate >= filter.startDate!);
    if (filter.endDate) orders = orders.filter(o => o.orderDate <= filter.endDate!);
    if (filter.status && filter.status !== 'All') orders = orders.filter(o => o.salesStatus === filter.status);

    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalTax = orders.reduce((s, o) => s + o.taxAmount, 0);
    const totalDiscount = orders.reduce((s, o) => s + o.discountAmount, 0);

    return {
      title: 'Sales & Revenue Orders Report',
      generatedAt: new Date().toLocaleString(),
      summary: {
        totalOrders: orders.length,
        totalSalesVolume: totalRevenue,
        totalTaxCollected: totalTax,
        totalDiscountsGiven: totalDiscount,
        averageOrderValue: orders.length ? totalRevenue / orders.length : 0
      },
      rows: orders.map(o => ({
        OrderNumber: o.orderNumber,
        Customer: o.customerName,
        Date: o.orderDate,
        ItemsCount: o.items.length,
        Subtotal: o.subtotal,
        Discount: o.discountAmount,
        Tax: o.taxAmount,
        Total: o.totalAmount,
        SalesStatus: o.salesStatus,
        PaymentStatus: o.paymentStatus
      }))
    };
  }

  getPurchaseReport(filter: ReportFilter = {}) {
    let pos = this.procurementService.purchaseOrders();
    if (filter.startDate) pos = pos.filter(p => p.orderDate >= filter.startDate!);
    if (filter.endDate) pos = pos.filter(p => p.orderDate <= filter.endDate!);
    if (filter.status && filter.status !== 'All') pos = pos.filter(p => p.status === filter.status);

    const totalSpend = pos.reduce((s, p) => s + p.totalAmount, 0);

    return {
      title: 'Procurement & Purchase Orders Report',
      generatedAt: new Date().toLocaleString(),
      summary: {
        totalPOs: pos.length,
        totalSpend,
        receivedOrdersCount: pos.filter(p => p.status === 'Received').length,
        pendingOrdersCount: pos.filter(p => p.status === 'Pending Approval' || p.status === 'Ordered').length
      },
      rows: pos.map(p => ({
        PONumber: p.poNumber,
        Supplier: p.supplierName,
        OrderDate: p.orderDate,
        ExpectedDelivery: p.expectedDeliveryDate,
        Subtotal: p.subtotal,
        Tax: p.taxAmount,
        TotalAmount: p.totalAmount,
        Status: p.status,
        CreatedBy: p.createdBy
      }))
    };
  }

  getRevenueReport(filter: ReportFilter = {}) {
    const invoices = this.invoiceService.invoices();
    const payments: Array<{
      PaymentID: string;
      InvoiceNumber: string;
      Customer: string;
      Date: string;
      Method: string;
      Reference: string;
      Amount: number;
    }> = [];

    invoices.forEach(inv => {
      inv.payments?.forEach(pay => {
        if (filter.startDate && pay.paymentDate < filter.startDate) return;
        if (filter.endDate && pay.paymentDate > filter.endDate) return;
        payments.push({
          PaymentID: pay.paymentId,
          InvoiceNumber: inv.invoiceNumber,
          Customer: inv.customerName,
          Date: pay.paymentDate,
          Method: pay.paymentMethod,
          Reference: pay.transactionReference,
          Amount: pay.amount
        });
      });
    });

    const totalCollected = payments.reduce((s, p) => s + p.Amount, 0);

    return {
      title: 'Collected Revenue & Cash Flow Report',
      generatedAt: new Date().toLocaleString(),
      summary: {
        totalTransactions: payments.length,
        totalCollectedCash: totalCollected,
        totalInvoicedAmount: this.invoiceService.totalInvoicedAmount(),
        outstandingReceivables: this.invoiceService.totalOutstandingAmount()
      },
      rows: payments
    };
  }

  getExpenseReport(filter: ReportFilter = {}) {
    let expenses = this.expenseService.expenses();
    if (filter.startDate) expenses = expenses.filter(e => e.expenseDate >= filter.startDate!);
    if (filter.endDate) expenses = expenses.filter(e => e.expenseDate <= filter.endDate!);
    if (filter.category && filter.category !== 'All') expenses = expenses.filter(e => e.category === filter.category);

    const total = expenses.reduce((s, e) => s + e.amount, 0);

    return {
      title: 'Operational Expenditure & Expense Report',
      generatedAt: new Date().toLocaleString(),
      summary: {
        totalExpenseCount: expenses.length,
        totalAmount: total,
        paidExpenses: expenses.filter(e => e.status === 'Paid').reduce((s, e) => s + e.amount, 0),
        pendingExpenses: expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + e.amount, 0)
      },
      rows: expenses.map(e => ({
        ExpenseID: e.expenseId,
        Title: e.title,
        Category: e.category,
        Date: e.expenseDate,
        Amount: e.amount,
        Method: e.paymentMethod,
        Status: e.status,
        Description: e.description
      }))
    };
  }

  getProfitAndLossReport() {
    const revenue = this.financeService.totalRevenue();
    const invoicedSales = this.financeService.totalInvoicedSales();
    const operatingExpenses = this.financeService.totalOperationalExpenses();
    const procurementSpend = this.financeService.totalPurchaseSpend();
    const totalExpenses = operatingExpenses + procurementSpend;
    const netProfit = revenue - totalExpenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      title: 'Corporate Profit and Loss (P&L) Statement',
      generatedAt: new Date().toLocaleString(),
      summary: {
        totalRevenue: revenue,
        totalInvoicedSales: invoicedSales,
        totalOperatingExpenses: operatingExpenses,
        procurementCostOfGoods: procurementSpend,
        totalExpenses,
        netProfit,
        profitMargin: profitMargin.toFixed(2) + '%'
      },
      breakdown: [
        { item: 'Cash Revenue Collected from Sales', type: 'Credit', amount: revenue },
        { item: 'Cost of Inventory & Goods Procured', type: 'Debit', amount: procurementSpend },
        { item: 'Operating, Facilities & Administrative Expenses', type: 'Debit', amount: operatingExpenses },
        { item: 'Estimated Monthly Payroll Obligation', type: 'Informational', amount: this.financeService.monthlyPayroll() }
      ]
    };
  }

  getOutstandingInvoiceReport() {
    const invoices = this.invoiceService.invoices().filter(i => i.outstandingAmount > 0);
    const totalOutstanding = invoices.reduce((s, i) => s + i.outstandingAmount, 0);
    const overdueTotal = invoices.filter(i => i.paymentStatus === 'Overdue').reduce((s, i) => s + i.outstandingAmount, 0);

    return {
      title: 'Accounts Receivable & Outstanding Invoices',
      generatedAt: new Date().toLocaleString(),
      summary: {
        unpaidInvoicesCount: invoices.length,
        totalOutstandingReceivables: totalOutstanding,
        overdueRiskAmount: overdueTotal,
        healthyPendingAmount: totalOutstanding - overdueTotal
      },
      rows: invoices.map(i => ({
        InvoiceNumber: i.invoiceNumber,
        Customer: i.customerName,
        InvoiceDate: i.invoiceDate,
        DueDate: i.dueDate,
        TotalAmount: i.totalAmount,
        PaidAmount: i.paidAmount,
        OutstandingBalance: i.outstandingAmount,
        PaymentStatus: i.paymentStatus
      }))
    };
  }

  getInventoryValuationReport(categoryFilter?: string) {
    let products = this.inventoryService.products();
    if (categoryFilter && categoryFilter !== 'All') {
      products = products.filter(p => p.category === categoryFilter);
    }

    const totalPurchaseVal = products.reduce((s, p) => s + (p.purchasePrice * p.availableQuantity), 0);
    const totalSellingVal = products.reduce((s, p) => s + (p.sellingPrice * p.availableQuantity), 0);
    const totalUnits = products.reduce((s, p) => s + p.availableQuantity, 0);

    return {
      title: 'Inventory Stock Valuation Report',
      generatedAt: new Date().toLocaleString(),
      summary: {
        totalSKUs: products.length,
        totalUnitsInStock: totalUnits,
        totalValuationAtCost: totalPurchaseVal,
        totalValuationAtSellingPrice: totalSellingVal,
        unrealizedGrossMargin: totalSellingVal - totalPurchaseVal
      },
      rows: products.map(p => ({
        SKU: p.sku,
        Name: p.name,
        Category: p.category,
        Warehouse: p.warehouse,
        UnitsAvailable: p.availableQuantity,
        CostPrice: p.purchasePrice,
        SellingPrice: p.sellingPrice,
        TotalCostValuation: p.purchasePrice * p.availableQuantity,
        TotalRetailValuation: p.sellingPrice * p.availableQuantity,
        StockStatus: p.status
      }))
    };
  }

  getEmployeeSalaryReport(deptFilter?: string) {
    let employees = this.employeeService.employees();
    if (deptFilter && deptFilter !== 'All') {
      employees = employees.filter(e => e.departmentName === deptFilter);
    }

    const totalSalary = employees.reduce((s, e) => s + e.salary, 0);

    return {
      title: 'Human Resources Employee Payroll Report',
      generatedAt: new Date().toLocaleString(),
      summary: {
        headcount: employees.length,
        totalMonthlyPayroll: totalSalary,
        annualizedPayroll: totalSalary * 12,
        averageMonthlyCompensation: employees.length ? Math.round(totalSalary / employees.length) : 0
      },
      rows: employees.map(e => ({
        EmployeeID: e.employeeId,
        FullName: e.fullName,
        Department: e.departmentName,
        Designation: e.designation,
        JoiningDate: e.joiningDate,
        MonthlySalary: e.salary,
        EmploymentStatus: e.employmentStatus
      }))
    };
  }

  exportToCSV(filename: string, rows: Record<string, any>[]): void {
    if (!rows || rows.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(header => {
          let val = row[header];
          if (val === null || val === undefined) val = '';
          val = String(val).replace(/"/g, '""');
          if (val.includes(',') || val.includes('\n') || val.includes('"')) {
            val = `"${val}"`;
          }
          return val;
        }).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  printReport(): void {
    window.print();
  }
}

