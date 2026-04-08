import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import type { AppNotification } from '../models/dashboard.model';
import { NotificationsActions } from '../../store/notifications/notifications.actions';
import { selectAllNotifications } from '../../store/notifications/notifications.selectors';

@Injectable({ providedIn: 'root' })
export class NotificationsFacade {
  private readonly store = inject(Store);

  readonly all$ = this.store.select(selectAllNotifications);

  forUser$(userId: string) {
    return this.all$.pipe(map((items) => items.filter((n) => n.userId === userId)));
  }

  unreadCount$(userId: string) {
    return this.forUser$(userId).pipe(map((items) => items.filter((n) => !n.read).length));
  }

  add(notification: AppNotification): void {
    this.store.dispatch(NotificationsActions.addNotification({ notification }));
  }

  markRead(notificationId: string): void {
    this.store.dispatch(NotificationsActions.markRead({ notificationId }));
  }

  markAllRead(userId: string): void {
    this.store.dispatch(NotificationsActions.markAllRead({ userId }));
  }
}
