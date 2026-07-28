import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications";
import { showOsNotification } from "../lib/push";

const KEY = ["notifications"] as const;

export function useNotifications() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: () => notificationsService.list() });

  // Keep the feed live.
  useEffect(() => {
    const sub = notificationsService.subscribe((fresh) => {
      if (fresh) showOsNotification(fresh); // OS alert when the tab is backgrounded
      void queryClient.invalidateQueries({ queryKey: KEY });
    });
    return () => sub.unsubscribe();
  }, [queryClient]);

  const markAllRead = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });

  const items = query.data ?? [];
  const unread = items.filter((n) => !n.readAt).length;
  return { items, unread, isLoading: query.isLoading, markAllRead };
}
