import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { DemoDataService } from './demo-data.service';
import { AppNotification } from '../models/erp.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly KEY = 'erp_notifications';
  notifications = signal<AppNotification[]>([]);

  unreadCount = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  constructor(
    private storage: StorageService,
    private demoData: DemoDataService
  ) {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    const data = this.storage.getItem<AppNotification[]>(this.KEY, this.demoData.getDemoNotifications());
    this.notifications.set(data);
  }

  private save(data: AppNotification[]): void {
    this.notifications.set(data);
    this.storage.setItem(this.KEY, data);
  }

  notify(title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info', link?: string): void {
    const newItem: AppNotification = {
      id: 'notif-' + Date.now(),
      title,
      message,
      type,
      date: 'Just now',
      read: false,
      link
    };
    const updated = [newItem, ...this.notifications()];
    this.save(updated);
  }

  markAsRead(id: string): void {
    const updated = this.notifications().map(n => n.id === id ? { ...n, read: true } : n);
    this.save(updated);
  }

  markAllAsRead(): void {
    const updated = this.notifications().map(n => ({ ...n, read: true }));
    this.save(updated);
  }

  clearAll(): void {
    this.save([]);
  }

  resetDemo(): void {
    this.save(this.demoData.getDemoNotifications());
  }
}

