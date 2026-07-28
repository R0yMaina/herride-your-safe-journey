import { supabase } from "@/integrations/supabase/client";
import type { RideSubscription } from "@/services/ride/rides.service";
import type { IChatService, RideMessage } from "./chat.service";

interface MessageRow {
  readonly id: string;
  readonly ride_id: string;
  readonly sender_id: string;
  readonly body: string;
  readonly created_at: string;
}

function mapRow(row: MessageRow): RideMessage {
  return {
    id: row.id,
    rideId: row.ride_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export class SupabaseChatService implements IChatService {
  async list(rideId: string): Promise<readonly RideMessage[]> {
    const { data, error } = await supabase
      .from("ride_messages")
      .select("*")
      .eq("ride_id", rideId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data as MessageRow[]).map(mapRow);
  }

  async send(rideId: string, body: string): Promise<RideMessage> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error(authError?.message ?? "Not signed in");
    const { data, error } = await supabase
      .from("ride_messages")
      .insert({ ride_id: rideId, sender_id: user.id, body: body.trim() })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data as MessageRow);
  }

  subscribe(rideId: string, onMessage: (message: RideMessage) => void): RideSubscription {
    const channel = supabase
      .channel(`ride-chat:${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ride_messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => onMessage(mapRow(payload.new as MessageRow)),
      )
      .subscribe();
    return { unsubscribe: () => void supabase.removeChannel(channel) };
  }
}
