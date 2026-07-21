import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { IconButton } from "@/components/common";
import { useNotifications } from "../hooks/useNotifications";

export function NotificationBell() {
  const { items, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <IconButton aria-label="Notifications" onClick={() => setOpen((v) => !v)}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-noir">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </IconButton>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label="Close notifications"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="absolute right-0 top-12 z-50 w-[86vw] max-w-sm overflow-hidden rounded-3xl border border-border/60 bg-noir/95 shadow-soft backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <p className="font-display text-base text-foreground">Notifications</p>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    className="flex items-center gap-1 text-xs text-primary"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No notifications yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {items.map((n) => (
                      <li
                        key={n.id}
                        className={`px-4 py-3 ${n.readAt ? "opacity-70" : "bg-primary/5"}`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.readAt && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                          <div className="min-w-0">
                            <p className="font-display text-sm text-foreground">{n.title}</p>
                            {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                              {new Date(n.createdAt).toLocaleString("en-KE", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
