import { supabase } from "@/integrations/supabase/client";
import type { AuditEntry, IAuditService } from "./audit.service";

export class SupabaseAuditService implements IAuditService {
  async list(limit = 50): Promise<readonly AuditEntry[]> {
    const { data, error } = await supabase.rpc("list_audit_log", { _limit: limit });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      action: r.action,
      entity: r.entity,
      entityId: r.entity_id,
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      createdAt: r.created_at,
    }));
  }
}
