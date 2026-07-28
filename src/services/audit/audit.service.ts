export interface AuditEntry {
  readonly id: string;
  readonly actorId: string | null;
  readonly action: string;
  readonly entity: string;
  readonly entityId: string | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
}

/** Admin-only view of the immutable audit log (refunds, payouts, config
 * changes). Backed by the append-only `audit_log` table. */
export interface IAuditService {
  list(limit?: number): Promise<readonly AuditEntry[]>;
}

export class MockAuditService implements IAuditService {
  async list(): Promise<readonly AuditEntry[]> {
    await new Promise<void>((r) => setTimeout(r, 120));
    return [
      {
        id: "a1",
        actorId: "admin",
        action: "refund",
        entity: "ride",
        entityId: "r1",
        metadata: { amount: 530, reason: "Driver no-show" },
        createdAt: new Date().toISOString(),
      },
      {
        id: "a2",
        actorId: "admin",
        action: "pricing_config_update",
        entity: "pricing_config",
        entityId: null,
        metadata: { commission_rate: 0.1 },
        createdAt: new Date(Date.now() - 3600_000).toISOString(),
      },
    ];
  }
}
