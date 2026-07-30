export type DriverApplicationStatus = "pending" | "verified" | "rejected" | "suspended";

export interface DriverApplication {
  readonly status: DriverApplicationStatus;
  readonly licenseNumber: string;
  readonly nationalId: string;
  readonly vehicleMake: string;
  readonly vehicleModel: string;
  readonly vehiclePlate: string;
  readonly vehicleColor: string | null;
  readonly vehicleYear: number | null;
  readonly selfieUrl: string | null;
  readonly idDocumentUrl: string | null;
  readonly rejectionReason: string | null;
  readonly appliedAt: string;
}

export interface DriverApplicationInput {
  readonly licenseNumber: string;
  readonly nationalId: string;
  readonly vehicleMake: string;
  readonly vehicleModel: string;
  readonly vehiclePlate: string;
  readonly vehicleColor?: string;
  readonly vehicleYear?: number;
  /** Identity photos, pre-uploaded via uploadDocument. */
  readonly selfieUrl?: string;
  readonly idDocumentUrl?: string;
}

/**
 * Where a driver stands on her periodic identity re-check.
 *
 * Verification used to be permanent, which meant an account could be lent or
 * sold with nothing noticing — the one failure that breaks the product's whole
 * promise. She now re-proves it on a schedule.
 */
export interface DriverCheckState {
  /** False once the check is overdue — she cannot go online or be matched. */
  readonly isCurrent: boolean;
  readonly lastCheckedAt: string | null;
  readonly dueAt: string | null;
  /** A submission is waiting on the verification desk. */
  readonly pendingReview: boolean;
}

export interface IDriverOnboardingService {
  /** The caller's application, or null if she never applied. */
  getMyApplication(): Promise<DriverApplication | null>;
  /** Submit (or re-submit after rejection) a driver application. */
  apply(input: DriverApplicationInput): Promise<DriverApplication>;
  /** Upload an identity document; returns the stored path for apply(). */
  uploadDocument(kind: "selfie" | "id", file: File): Promise<string>;
  /** Whether her identity check is current, and when the next one is due. */
  getCheckState(): Promise<DriverCheckState | null>;
  /** Submit a fresh selfie for review. Reviewed by a person, not a script. */
  submitCheck(selfieUrl: string): Promise<void>;
}

const delay = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms));

export class MockDriverOnboardingService implements IDriverOnboardingService {
  private application: DriverApplication | null = null;

  async getMyApplication(): Promise<DriverApplication | null> {
    await delay(120);
    return this.application;
  }

  async apply(input: DriverApplicationInput): Promise<DriverApplication> {
    await delay();
    if (this.application && ["pending", "verified"].includes(this.application.status)) {
      throw new Error(`You already have a ${this.application.status} application`);
    }
    this.application = {
      status: "pending",
      licenseNumber: input.licenseNumber.trim(),
      nationalId: input.nationalId.trim(),
      vehicleMake: input.vehicleMake.trim(),
      vehicleModel: input.vehicleModel.trim(),
      vehiclePlate: input.vehiclePlate.trim().toUpperCase(),
      vehicleColor: input.vehicleColor?.trim() || null,
      vehicleYear: input.vehicleYear ?? null,
      selfieUrl: input.selfieUrl ?? null,
      idDocumentUrl: input.idDocumentUrl ?? null,
      rejectionReason: null,
      appliedAt: new Date().toISOString(),
    };
    return this.application;
  }

  async uploadDocument(kind: "selfie" | "id"): Promise<string> {
    await delay();
    return `mock://driver-docs/${kind}-${Date.now()}.jpg`;
  }

  async getCheckState(): Promise<DriverCheckState | null> {
    await delay(80);
    if (!this.application) return null;
    // Mock mode reports a due check, so the prompt is reachable without
    // waiting a month for the real clock.
    return {
      isCurrent: this.checkSubmitted,
      lastCheckedAt: this.checkSubmitted ? new Date().toISOString() : null,
      dueAt: null,
      pendingReview: false,
    };
  }

  async submitCheck(): Promise<void> {
    await delay();
    this.checkSubmitted = true;
  }

  private checkSubmitted = false;
}
