import { supabase } from "@/integrations/supabase/client";
import type { User } from "@/types/user";
import type { IUserService } from "./user.service";
import { mapSupabaseUser } from "./user-mapper";

async function loadCurrentUser(): Promise<User> {
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();
  if (error || !authUser) throw new Error(error?.message ?? "Not signed in");

  const [profileResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", authUser.id),
  ]);
  const profile = profileResult.error ? null : profileResult.data;
  const roles = rolesResult.error ? [] : (rolesResult.data ?? []).map((r) => r.role);
  return mapSupabaseUser(authUser, profile, roles);
}

export class SupabaseUserService implements IUserService {
  async getCurrent(): Promise<User> {
    return loadCurrentUser();
  }

  async updateProfile(patch: Partial<User["profile"]>): Promise<User> {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error(authError?.message ?? "Not signed in");

    const update: {
      full_name?: string;
      avatar_url?: string | null;
      date_of_birth?: string | null;
    } = {};
    if (patch.firstName !== undefined || patch.lastName !== undefined) {
      const current = await loadCurrentUser();
      const firstName = patch.firstName ?? current.profile.firstName;
      const lastName = patch.lastName ?? current.profile.lastName;
      update.full_name = `${firstName} ${lastName}`.trim();
    }
    if (patch.avatarUrl !== undefined) update.avatar_url = patch.avatarUrl ?? null;
    if (patch.dateOfBirth !== undefined) update.date_of_birth = patch.dateOfBirth ?? null;

    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from("profiles").update(update).eq("id", authUser.id);
      if (error) throw new Error(error.message);
    }
    return loadCurrentUser();
  }

  async deleteAccount(reason?: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Storage is not reachable from SQL, so identity documents are cleared
    // here BEFORE the RPC scrubs the rows that point at them. Doing it after
    // would leave the paths gone and the files behind.
    if (user) {
      for (const bucket of ["driver-docs", "rider-docs"] as const) {
        const { data: files } = await supabase.storage.from(bucket).list(user.id);
        if (files?.length) {
          await supabase.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
        }
      }
    }

    const { error } = await supabase.rpc("delete_my_account", { _reason: reason ?? undefined });
    if (error) throw new Error(error.message);

    // Nothing left to be signed in to.
    await supabase.auth.signOut();
  }
}
