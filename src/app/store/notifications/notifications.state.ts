export interface AppNotification {
  id: string;
  userId: string;
  type: 'report_required' | 'report_submitted' | 'payment_released' | 'new_message' | 'mentorship_request' | 'payment_updated' | 'account_updated';
  title: string;
  body: string;
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationsState {
  items: AppNotification[];
  loaded: boolean;
}

export const notificationsInitialState: NotificationsState = {
  items: [],
  loaded: false,
};
