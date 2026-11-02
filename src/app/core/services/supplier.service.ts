import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { DemoDataService } from './demo-data.service';
import { Supplier } from '../models/erp.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private readonly KEY = 'erp_suppliers';
  suppliers = signal<Supplier[]>([]);

  constructor(
    private storage: StorageService,
    private demoData: DemoDataService
  ) {
    this.loadSuppliers();
  }

  private loadSuppliers(): void {
    const data = this.storage.getItem<Supplier[]>(this.KEY, this.demoData.getDemoSuppliers());
    this.suppliers.set(data);
  }

  private save(data: Supplier[]): void {
    this.suppliers.set(data);
    this.storage.setItem(this.KEY, data);
  }

  getSupplierById(id: string): Supplier | undefined {
    return this.suppliers().find(s => s.id === id || s.supplierId === id);
  }

  addSupplier(supplier: Omit<Supplier, 'id' | 'supplierId'>): Supplier {
    const list = this.suppliers();
    const nextNum = 3000 + list.length + 1;
    const newSupplier: Supplier = {
      ...supplier,
      id: 'sup-' + Date.now(),
      supplierId: `SUP-${nextNum}`
    };
    this.save([...list, newSupplier]);
    return newSupplier;
  }

  updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
    let result: Supplier | null = null;
    const updated = this.suppliers().map(s => {
      if (s.id === id || s.supplierId === id) {
        result = { ...s, ...updates };
        return result;
      }
      return s;
    });
    if (result) {
      this.save(updated);
    }
    return result;
  }

  deleteSupplier(id: string, hasActivePOs: boolean): { success: boolean; message: string } {
    if (hasActivePOs) {
      return {
        success: false,
        message: 'Cannot delete supplier with active purchase orders. Cancel or close purchase orders first.'
      };
    }
    const filtered = this.suppliers().filter(s => s.id !== id && s.supplierId !== id);
    this.save(filtered);
    return { success: true, message: 'Supplier removed successfully.' };
  }

  resetDemo(): void {
    this.save(this.demoData.getDemoSuppliers());
  }
}

