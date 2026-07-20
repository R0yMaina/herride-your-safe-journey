import { env } from "@/config/env";
import { MockTrustedContactsService, type ITrustedContactsService } from "./contacts.service";
import { SupabaseTrustedContactsService } from "./supabase-contacts.service";

export const trustedContactsService: ITrustedContactsService = env.useMocks
  ? new MockTrustedContactsService()
  : new SupabaseTrustedContactsService();

export type { ITrustedContactsService, NewTrustedContact } from "./contacts.service";
