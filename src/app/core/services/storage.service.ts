import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly PREFIX = 'hcl_erp_';

  getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(this.PREFIX + key);
      if (data === null || data === undefined) {
        return defaultValue;
      }
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (e) {
      console.error(`Error removing ${key} from localStorage:`, e);
    }
  }

  clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error('Error clearing ERP localStorage:', e);
    }
  }

  hasKey(key: string): boolean {
    return localStorage.getItem(this.PREFIX + key) !== null;
  }
}

