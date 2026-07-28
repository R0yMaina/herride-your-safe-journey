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

export interface IDriverOnboardingService {
  /** The caller's application, or null if she never applied. */
  getMyApplication(): Promise<DriverApplication | null>;
  /** Submit (or re-submit after rejection) a driver application. */
  apply(input: DriverApplicationInput): Promise<DriverApplication>;
  /** Upload an identity document; returns the stored path for apply(). */
  uploadDocument(kind: "selfie" | "id", file: File): Promise<string>;
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
}
