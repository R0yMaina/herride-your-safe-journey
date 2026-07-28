import type { RideSubscription } from "@/services/ride/rides.service";

export interface RideMessage {
  readonly id: string;
  readonly rideId: string;
  readonly senderId: string;
  readonly body: string;
  readonly createdAt: string;
}

export interface IChatService {
  /** Message history for a ride, oldest first. */
  list(rideId: string): Promise<readonly RideMessage[]>;
  /** Send a message on a live ride (RLS enforces participant + live status). */
  send(rideId: string, body: string): Promise<RideMessage>;
  /** Stream new messages for a ride as they arrive. */
  subscribe(rideId: string, onMessage: (message: RideMessage) => void): RideSubscription;
}

/** One-tap quick replies (Uber's "one-click chat" pattern). */
export const QUICK_REPLIES: readonly string[] = [
  "I'm outside",
  "I'm on my way",
  "2 minutes away",
  "Please wait a moment",
  "Where exactly are you?",
];

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms));

export class MockChatService implements IChatService {
  private readonly messages = new Map<string, RideMessage[]>();
  private readonly listeners = new Map<string, Set<(m: RideMessage) => void>>();

  async list(rideId: string): Promise<readonly RideMessage[]> {
    await delay(120);
    return this.messages.get(rideId) ?? [];
  }

  async send(rideId: string, body: string): Promise<RideMessage> {
    await delay();
    const text = body.trim();
    if (!text) throw new Error("Message is empty");
    const message: RideMessage = {
      id: crypto.randomUUID(),
      rideId,
      senderId: "mock-user",
      body: text,
      createdAt: new Date().toISOString(),
    };
    const list = this.messages.get(rideId) ?? [];
    this.messages.set(rideId, [...list, message]);
    this.listeners.get(rideId)?.forEach((fn) => fn(message));
    return message;
  }

  subscribe(rideId: string, onMessage: (message: RideMessage) => void): RideSubscription {
    const set = this.listeners.get(rideId) ?? new Set();
    set.add(onMessage);
    this.listeners.set(rideId, set);
    return { unsubscribe: () => set.delete(onMessage) };
  }
}
