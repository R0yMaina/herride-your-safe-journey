export interface AppNotification {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body: string | null;
  readonly rideId: string | null;
  readonly readAt: string | null;
  readonly createdAt: string;
}

export type NotificationSubscription = { unsubscribe: () => void };

export interface INotificationsService {
  list(): Promise<readonly AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  /** Live subscription to new notifications for the current user. */
  subscribe(onChange: () => void): NotificationSubscription;
}

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms));

export class MockNotificationsService implements INotificationsService {
  async list() {
    await delay();
    return [];
  }
  async markRead() {
    await delay();
  }
  async markAllRead() {
    await delay();
  }
  subscribe(): NotificationSubscription {
    return { unsubscribe: () => {} };
  }
}
