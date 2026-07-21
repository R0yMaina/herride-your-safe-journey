import { supabase } from "@/integrations/supabase/client";
import type {
  AppNotification,
  INotificationsService,
  NotificationSubscription,
} from "./notifications.service";

export class SupabaseNotificationsService implements INotificationsService {
  async list(): Promise<readonly AppNotification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, ride_id, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      rideId: n.ride_id,
      readAt: n.read_at,
      createdAt: n.created_at,
    }));
  }

  async markRead(id: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async markAllRead(): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    if (error) throw new Error(error.message);
  }

  subscribe(onChange: () => void): NotificationSubscription {
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () =>
        onChange(),
      )
      .subscribe();
    return {
      unsubscribe: () => {
        void supabase.removeChannel(channel);
      },
    };
  }
}
