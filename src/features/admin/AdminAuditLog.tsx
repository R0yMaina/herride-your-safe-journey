import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { GlassCard, Section } from "@/components/common";
import { auditService } from "@/services/audit";

const ACTION_LABEL: Record<string, string> = {
  refund: "Refund issued",
  payout: "Payout requested",
  pricing_config_update: "Pricing updated",
  driver_status: "Driver status changed",
};

/** Immutable trail of sensitive financial actions (admin-only). */
export function AdminAuditLog() {
  const { data } = useQuery({
    queryKey: ["admin", "audit-log"],
    queryFn: () => auditService.list(20),
  });

  return (
    <Section title="Audit log">
      <GlassCard className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground">Append-only · sensitive actions</p>
        </div>
        {(data?.length ?? 0) === 0 ? (
          <p className="text-xs text-muted-foreground">No recorded actions yet</p>
        ) : (
          <div className="space-y-2">
            {data?.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block text-foreground">
                    {ACTION_LABEL[e.action] ?? e.action}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {e.entity}
                    {e.entityId ? ` · ${e.entityId.slice(0, 8)}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString("en-KE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </Section>
  );
}
