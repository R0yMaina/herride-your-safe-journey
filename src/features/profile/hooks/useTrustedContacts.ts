import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trustedContactsService, type NewTrustedContact } from "@/services/contacts";

const QUERY_KEY = ["trusted-contacts"] as const;

export function useTrustedContacts() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => trustedContactsService.list(),
  });
}

export function useAddTrustedContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contact: NewTrustedContact) => trustedContactsService.add(contact),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveTrustedContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trustedContactsService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
