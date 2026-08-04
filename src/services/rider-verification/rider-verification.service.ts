export type RiderVerificationStatus = "none" | "pending" | "verified" | "rejected";

/** Where a rider stands, and whether it currently blocks her from booking. */
export interface RiderVerificationState {
  readonly isVerified: boolean;
  readonly status: RiderVerificationStatus;
  readonly rejectReason: string | null;
  readonly submittedAt: string | null;
  /** Whether the platform currently requires verification at all. */
  readonly required: boolean;
  /** Completed rides left before an unverified rider is stopped. */
  readonly ridesRemaining: number;
}

/**
 * Would the database refuse her next booking?
 *
 * Mirrors `rider_may_book` server-side. The client copy exists only so she is
 * warned before she taps Confirm — the DB trigger is what actually decides.
 */
export function verificationBlocksBooking(state: RiderVerificationState): boolean {
  if (!state.required || state.isVerified) return false;
  return state.ridesRemaining <= 0;
}

export interface RiderVerificationInput {
  /** Storage paths from uploadDocument, not public URLs. */
  readonly selfieUrl: string;
  readonly idDocumentUrl: string;
  readonly idNumber?: string;
}

/** One rider waiting on the verification desk. */
export interface PendingRiderVerification {
  readonly id: string;
  readonly userId: string;
  readonly fullName: string | null;
  readonly phone: string | null;
  readonly gender: string | null;
  readonly selfieUrl: string;
  readonly idDocumentUrl: string;
  readonly idNumber: string | null;
  readonly submittedAt: string;
}

/**
 * Rider identity verification.
 *
 * The female-only guarantee rested entirely on a self-declared field that the
 * rider could edit herself. This is the other half of closing that: she proves
 * who she is the same way a driver does — an ID, a selfie, and a person at the
 * desk who looks at both.
 */
export interface IRiderVerificationService {
  getState(): Promise<RiderVerificationState>;
  /** Upload a document; returns the stored path for submit(). */
  uploadDocument(kind: "selfie" | "id", file: File): Promise<string>;
  submit(input: RiderVerificationInput): Promise<void>;
  /** Admin: the review queue. */
  listPending(): Promise<readonly PendingRiderVerification[]>;
  /** Admin: approve, or reject with a reason she can act on. */
  review(verificationId: string, approve: boolean, reason?: string): Promise<void>;
  /** Admin: a short-lived link to a document in the private bucket. */
  documentUrl(path: string): Promise<string | null>;
}

const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

export class MockRiderVerificationService implements IRiderVerificationService {
  private state: RiderVerificationState = {
    isVerified: false,
    status: "none",
    rejectReason: null,
    submittedAt: null,
    required: true,
    ridesRemaining: 2,
  };

  async getState(): Promise<RiderVerificationState> {
    await delay(100);
    return this.state;
  }

  async uploadDocument(kind: "selfie" | "id"): Promise<string> {
    await delay();
    return `mock://rider-docs/${kind}-${Date.now()}.jpg`;
  }

  async submit(): Promise<void> {
    await delay();
    this.state = { ...this.state, status: "pending", submittedAt: new Date().toISOString() };
  }

  async listPending(): Promise<readonly PendingRiderVerification[]> {
    await delay();
    return [];
  }

  async review(): Promise<void> {
    await delay();
    throw new Error("Mock service cannot review verifications");
  }

  async documentUrl(): Promise<string | null> {
    await delay(50);
    return null;
  }
}
