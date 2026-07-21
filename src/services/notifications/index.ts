import { env } from "@/config/env";
import { MockNotificationsService, type INotificationsService } from "./notifications.service";
import { SupabaseNotificationsService } from "./supabase-notifications.service";

export const notificationsService: INotificationsService = env.useMocks
  ? new MockNotificationsService()
  : new SupabaseNotificationsService();

export type {
  INotificationsService,
  AppNotification,
  NotificationSubscription,
} from "./notifications.service";
