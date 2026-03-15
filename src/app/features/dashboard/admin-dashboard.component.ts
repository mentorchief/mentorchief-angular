import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Store } from '@ngrx/store';
import type { AppState } from '../../store/app.state';
import { selectAuthUser } from '../auth/store/auth.selectors';
import {
  selectAdminStatsComputed,
  selectAdminRecentActivities,
} from './store/dashboard.selectors';
import type { User } from '../../core/models/user.model';

@Component({
  selector: 'mc-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <fa-icon [icon]="['fas', 'shield-halved']" class="text-white w-5 h-5" />
          </div>
          <div>
            <h1 class="text-2xl text-gray-900 font-bold">Admin Control Panel</h1>
            @if (user$ | async; as user) {
              <p class="text-gray-500 text-sm">Welcome back, {{ user.name }}</p>
            }
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        @for (stat of (adminStats$ | async) ?? []; track stat.label) {
          <div class="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <fa-icon [icon]="stat.icon" [class]="stat.color" class="w-5 h-5" />
              </div>
              <span class="text-xs text-green-600 font-medium">{{ stat.change }}</span>
            </div>
            <p class="text-gray-500 text-sm mb-1">{{ stat.label }}</p>
            <p class="text-2xl text-gray-900 font-bold">{{ stat.value }}</p>
          </div>
        }
      </div>

      <div class="grid lg:grid-cols-1 gap-6">
        <!-- Recent Activity -->
        <div class="bg-white border border-gray-200 rounded-lg">
          <div class="p-5 border-b border-gray-200">
            <h2 class="text-gray-900 font-medium">Recent Activity</h2>
            <p class="text-gray-500 text-sm mt-1">Latest platform events</p>
          </div>
          <div class="p-5 space-y-4">
            @for (activity of (recentActivities$ | async) ?? []; track activity.time) {
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="text-gray-900 text-sm font-medium">{{ activity.type }}</p>
                      <p class="text-gray-500 text-sm">{{ activity.name }}</p>
                      <p class="text-gray-500 text-xs mt-0.5">{{ activity.detail }}</p>
                    </div>
                    <span class="text-xs text-gray-400 whitespace-nowrap">{{ activity.time }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <h2 class="text-gray-900 font-medium mb-4">Quick Actions</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a routerLink="/dashboard/admin/users" class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors no-underline">
            <fa-icon [icon]="['fas', 'users']" class="text-indigo-600 text-xl w-5 h-5" />
            <p class="text-gray-900 text-sm font-medium mt-2">User Management</p>
            <p class="text-gray-500 text-xs mt-1">Manage users & roles</p>
          </a>
          <a routerLink="/dashboard/admin/payments" class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors no-underline">
            <fa-icon [icon]="['fas', 'dollar-sign']" class="text-indigo-600 text-xl w-5 h-5" />
            <p class="text-gray-900 text-sm font-medium mt-2">Payments</p>
            <p class="text-gray-500 text-xs mt-1">Transaction history</p>
          </a>
          <a routerLink="/dashboard/admin/settings" class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors no-underline">
            <fa-icon [icon]="['fas', 'gear']" class="text-indigo-600 text-xl w-5 h-5" />
            <p class="text-gray-900 text-sm font-medium mt-2">Settings</p>
            <p class="text-gray-500 text-xs mt-1">Platform configuration</p>
          </a>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  private readonly store = inject(Store<AppState>);
  readonly user$ = this.store.select(selectAuthUser);
  readonly adminStats$ = this.store.select(selectAdminStatsComputed);
  readonly recentActivities$ = this.store.select(selectAdminRecentActivities);
}
