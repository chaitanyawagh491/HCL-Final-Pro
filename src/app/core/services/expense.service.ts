import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { DemoDataService } from './demo-data.service';
import { Expense, ExpenseCategory } from '../models/erp.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly KEY = 'erp_expenses';
  expenses = signal<Expense[]>([]);

  totalExpensesAmount = computed(() => {
    return this.expenses()
      .filter(e => e.status === 'Paid')
      .reduce((sum, e) => sum + e.amount, 0);
  });

  pendingExpensesAmount = computed(() => {
    return this.expenses()
      .filter(e => e.status === 'Pending')
      .reduce((sum, e) => sum + e.amount, 0);
  });

  constructor(
    private storage: StorageService,
    private demoData: DemoDataService
  ) {
    this.loadExpenses();
  }

  private loadExpenses(): void {
    const data = this.storage.getItem<Expense[]>(this.KEY, this.demoData.getDemoExpenses());
    this.expenses.set(data);
  }

  private save(data: Expense[]): void {
    this.expenses.set(data);
    this.storage.setItem(this.KEY, data);
  }

  getExpenseById(id: string): Expense | undefined {
    return this.expenses().find(e => e.id === id || e.expenseId === id);
  }

  addExpense(expense: Omit<Expense, 'id' | 'expenseId'>): Expense {
    const list = this.expenses();
    const nextNum = 6000 + list.length + 1;
    const newExpense: Expense = {
      ...expense,
      id: 'exp-' + Date.now(),
      expenseId: `EXP-${nextNum}`
    };
    this.save([newExpense, ...list]);
    return newExpense;
  }

  updateExpense(id: string, updates: Partial<Expense>): Expense | null {
    let result: Expense | null = null;
    const updated = this.expenses().map(e => {
      if (e.id === id || e.expenseId === id) {
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

  deleteExpense(id: string): { success: boolean; message: string } {
    const filtered = this.expenses().filter(e => e.id !== id && e.expenseId !== id);
    this.save(filtered);
    return { success: true, message: 'Expense record deleted.' };
  }

  resetDemo(): void {
    this.save(this.demoData.getDemoExpenses());
  }
}

