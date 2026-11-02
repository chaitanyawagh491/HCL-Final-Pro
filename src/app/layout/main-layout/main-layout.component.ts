import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="layout-root" [class.sidebar-collapsed]="isSidebarCollapsed">
      <app-sidebar [isCollapsed]="isSidebarCollapsed"></app-sidebar>

      <div class="layout-main">
        <app-header (toggleSidebar)="isSidebarCollapsed = !isSidebarCollapsed"></app-header>

        <main class="app-main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-root {
      display: flex;
      min-height: 100vh;
      background-color: var(--erp-bg);
    }
    .layout-main {
      flex: 1;
      margin-left: var(--erp-sidebar-width);
      display: flex;
      flex-direction: column;
      min-width: 0;
      transition: margin-left 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .sidebar-collapsed .layout-main {
      margin-left: var(--erp-sidebar-collapsed-width);
    }
    .app-main-content {
      flex: 1;
      padding: 24px;
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
    }

    @media (max-width: 992px) {
      .layout-main {
        margin-left: 0 !important;
      }
      .app-main-content {
        padding: 16px;
      }
    }
  `]
})
export class MainLayoutComponent {
  isSidebarCollapsed = false;
}

