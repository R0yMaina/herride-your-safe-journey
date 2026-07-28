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

export interface IAdminDriversService {
  /** Applications in a given state — the verification queue. */
  list(status?: DriverVerificationStatus): Promise<readonly DriverApplicationSummary[]>;
  /** Approve / reject / suspend. Grants or revokes the driver role server-side. */
  setStatus(driverUserId: string, status: DriverVerificationStatus, reason?: string): Promise<void>;
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

  async getDocumentUrl() {
    await delay(50);
    return null;
  }
}
