import { env } from "@/config/env";
import { MockAuditService } from "./audit.service";
import type { IAuditService } from "./audit.service";
import { SupabaseAuditService } from "./supabase-audit.service";

export const auditService: IAuditService = env.useMocks
  ? new MockAuditService()
  : new SupabaseAuditService();

export type { IAuditService, AuditEntry } from "./audit.service";
