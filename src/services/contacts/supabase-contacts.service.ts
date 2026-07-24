import { supabase } from "@/integrations/supabase/client";
import type { EmergencyContact } from "@/types/user";
import type { ITrustedContactsService, NewTrustedContact } from "./contacts.service";

async function currentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error(error?.message ?? "Not signed in");
  return user.id;
}

export class SupabaseTrustedContactsService implements ITrustedContactsService {
  async list(): Promise<readonly EmergencyContact[]> {
    const { data, error } = await supabase
      .from("trusted_contacts")
      .select("id, name, phone, relationship")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      relation: row.relationship ?? undefined,
    }));
  }

  async add(contact: NewTrustedContact): Promise<EmergencyContact> {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("trusted_contacts")
      .insert({
        user_id: userId,
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relation ?? null,
      })
      .select("id, name, phone, relationship")
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      relation: data.relationship ?? undefined,
    };
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("trusted_contacts").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
