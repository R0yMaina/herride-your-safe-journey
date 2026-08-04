export type DriverVerificationStatus = "pending" | "verified" | "rejected" | "suspended";

export interface DriverApplicationSummary {
  readonly userId: string;
  readonly fullName: string | null;
  readonly phone: string | null;
  readonly licenseNumber: string;
  readonly nationalId: string;
  readonly vehicle: string;
  readonly vehiclePlate: string | null;
  readonly vehicleColor: string | null;
  readonly vehicleYear: number | null;
  readonly selfieUrl: string | null;
  readonly idDocumentUrl: string | null;
  readonly status: DriverVerificationStatus;
  readonly rejectionReason: string | null;
  readonly appliedAt: string;
}

/**
 * A driver's periodic identity re-check, waiting on the desk.
 *
 * `selfieUrl` is what she just submitted; `verificationSelfieUrl` is the photo
 * we approved her on. The reviewer compares the two — checking the new one
 * against the last new one would let an account drift to a different face a
 * fortnight at a time.
 */
export interface PendingDriverCheck {
  readonly id: string;
  readonly driverUserId: string;
  readonly fullName: string | null;
  readonly selfieUrl: string;
  readonly verificationSelfieUrl: string | null;
  readonly submittedAt: string;
  readonly lastCheckedAt: string | null;
}

export interface IAdminDriversService {
  /** Applications in a given state — the verification queue. */
  list(status?: DriverVerificationStatus): Promise<readonly DriverApplicationSummary[]>;
  /** Approve / reject / suspend. Grants or revokes the driver role server-side. */
  setStatus(driverUserId: string, status: DriverVerificationStatus, reason?: string): Promise<void>;
  /**
   * Re-checks waiting for review.
   *
   * Without this queue the phase 19 gate is a trap: a driver whose check comes
   * due cannot go online and cannot be matched, she submits a fresh selfie,
   * and nobody can clear it. She stays locked out permanently.
   */
  listPendingChecks(): Promise<readonly PendingDriverCheck[]>;
  /** Pass or fail one. Failing takes her offline immediately (server-side). */
  reviewCheck(checkId: string, passed: boolean, reason?: string): Promise<void>;
  /** Short-lived signed URL for a private identity document. */
  getDocumentUrl(path: string): Promise<string | null>;
}

const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

const SAMPLE: DriverApplicationSummary[] = [
  {
    userId: "mock-driver-1",
    fullName: "Amina Wanjiru",
    phone: "+254712345678",
    licenseNumber: "DL-4471902",
    nationalId: "31447190",
    vehicle: "Toyota Vitz",
    vehiclePlate: "KDA 221X",
    vehicleColor: "Silver",
    vehicleYear: 2017,
    selfieUrl: null,
    idDocumentUrl: null,
    status: "pending",
    rejectionReason: null,
    appliedAt: new Date(Date.now() - 3600_000).toISOString(),
  },
];

export class MockAdminDriversService implements IAdminDriversService {
  private applications = [...SAMPLE];

  async list(status: DriverVerificationStatus = "pending") {
    await delay();
    return this.applications.filter((a) => a.status === status);
  }

  async setStatus(driverUserId: string, status: DriverVerificationStatus, reason?: string) {
    await delay();
    this.applications = this.applications.map((a) =>
      a.userId === driverUserId ? { ...a, status, rejectionReason: reason ?? null } : a,
    );
  }

  private checks: PendingDriverCheck[] = [
    {
      id: "mock-check-1",
      driverUserId: "mock-driver-1",
      fullName: "Amina Wanjiru",
      selfieUrl: "mock://driver-docs/recheck.jpg",
      verificationSelfieUrl: "mock://driver-docs/original.jpg",
      submittedAt: new Date(Date.now() - 1800_000).toISOString(),
      lastCheckedAt: new Date(Date.now() - 31 * 86_400_000).toISOString(),
    },
  ];

  async listPendingChecks() {
    await delay();
    return this.checks;
  }

  async reviewCheck(checkId: string) {
    await delay();
    this.checks = this.checks.filter((c) => c.id !== checkId);
  }

  async getDocumentUrl() {
    await delay(50);
    return null;
  }
}
