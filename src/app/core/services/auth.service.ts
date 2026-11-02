import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { DemoDataService } from './demo-data.service';
import { User, UserRole } from '../models/erp.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly CURRENT_USER_KEY = 'auth_current_user';
  private readonly USERS_KEY = 'auth_users';

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());
  currentRole = computed(() => this.currentUser()?.role ?? null);

  constructor(
    private storage: StorageService,
    private demoData: DemoDataService,
    private router: Router
  ) {
    this.initUsers();
    this.loadSession();
  }

  private initUsers(): void {
    if (!this.storage.hasKey(this.USERS_KEY)) {
      this.storage.setItem(this.USERS_KEY, this.demoData.getDemoUsers());
    } else {
      // Ensure all 6 demo accounts are properly synchronized with credentials and designations
      this.getUsers();
    }
  }

  private loadSession(): void {
    const savedUser = this.storage.getItem<User | null>(this.CURRENT_USER_KEY, null);
    const users = this.getUsers();
    if (savedUser) {
      const matched = users.find(u => u.employeeId === savedUser.employeeId || u.role === savedUser.role);
      const activeUser = matched || users[0];
      this.currentUser.set(activeUser);
      this.storage.setItem(this.CURRENT_USER_KEY, activeUser);
    } else {
      // Default initial login as Chaitanya Santosh Wagh (Admin) for instant seamless full-access experience
      const defaultUser = users.find(u => u.role === 'Admin' || u.email === 'admin@erp.com') || users[0];
      this.currentUser.set(defaultUser);
      this.storage.setItem(this.CURRENT_USER_KEY, defaultUser);
    }
  }

  getUsers(): User[] {
    let users = this.storage.getItem<User[]>(this.USERS_KEY, this.demoData.getDemoUsers());
    const demoUsers = this.demoData.getDemoUsers();
    let hasChanges = false;

    // Merge & ensure all demo users are present with up-to-date roles, designations and credentials
    demoUsers.forEach(demo => {
      const idx = users.findIndex(u => u.employeeId === demo.employeeId || u.role === demo.role);
      if (idx !== -1) {
        if (!users[idx].password || !users[idx].designation || !users[idx].avatar || users[idx].avatar.includes('unsplash')) {
          users[idx] = { ...users[idx], ...demo, password: users[idx].password || demo.password };
          hasChanges = true;
        }
        if (demo.employeeId === 'EMP-1001' && (!users[idx].location || !users[idx].careerInterest)) {
          users[idx] = { ...users[idx], ...demo, password: users[idx].password || demo.password };
          hasChanges = true;
        }
      } else {
        users.push(demo);
        hasChanges = true;
      }
    });

    if (hasChanges || !this.storage.hasKey(this.USERS_KEY)) {
      this.storage.setItem(this.USERS_KEY, users);
    }
    return users;
  }

  updateCurrentUser(updates: Partial<User>): User {
    const current = this.currentUser();
    const updatedUser: User = {
      ...(current || {} as User),
      ...updates
    };
    this.currentUser.set(updatedUser);
    this.storage.setItem(this.CURRENT_USER_KEY, updatedUser);

    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === updatedUser.id || (updatedUser.employeeId && u.employeeId === updatedUser.employeeId));
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.storage.setItem(this.USERS_KEY, users);
    }
    return updatedUser;
  }

  changePassword(oldPassword: string, newPassword: string): { success: boolean; message: string } {
    const current = this.currentUser();
    if (!current) {
      return { success: false, message: 'No user session active.' };
    }
    if (current.password && oldPassword.trim() !== current.password.trim()) {
      return { success: false, message: 'Current password does not match your active account password.' };
    }
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'New password must be at least 4 characters in length.' };
    }
    const lastUpdate = new Date().toISOString().split('T')[0];
    this.updateCurrentUser({
      password: newPassword.trim(),
      lastPasswordUpdate: lastUpdate
    });
    return { success: true, message: 'Password has been successfully changed and saved.' };
  }

  login(email: string, password?: string, rememberMe = true): { success: boolean; message?: string } {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    let user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user && (cleanEmail === 'chaitanyawagh491@gmail.com' || cleanEmail === 'admin@erp.com')) {
      user = users.find(u => u.employeeId === 'EMP-1001' || u.role === 'Admin');
    }

    if (!user) {
      return { success: false, message: 'Invalid credentials. Please select one of the official demo accounts.' };
    }

    if (password && user.password && password.trim() !== user.password.trim()) {
      return { success: false, message: `Incorrect password for ${user.name}. (Expected: ${user.password})` };
    }

    this.currentUser.set(user);
    if (rememberMe) {
      this.storage.setItem(this.CURRENT_USER_KEY, user);
    }
    return { success: true };
  }

  switchDemoUser(role: UserRole): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.role === role);
    if (user) {
      this.currentUser.set(user);
      this.storage.setItem(this.CURRENT_USER_KEY, user);
      return user;
    }
    return null;
  }

  logout(): void {
    this.currentUser.set(null);
    this.storage.removeItem(this.CURRENT_USER_KEY);
    this.router.navigate(['/login']);
  }

  hasRole(allowedRoles: UserRole[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role === 'Admin') return true; // Admin has access everywhere
    return allowedRoles.includes(user.role);
  }
}

