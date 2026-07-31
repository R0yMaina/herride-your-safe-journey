import type { User } from "@/types/user";
import { delay, mockUser } from "./mock-data";

export interface IUserService {
  getCurrent(): Promise<User>;
  updateProfile(patch: Partial<User["profile"]>): Promise<User>;
  /**
   * Erase the account under the Kenya DPA 2019 right to deletion.
   *
   * Anonymises rather than deletes: personal data is destroyed, the financial
   * skeleton survives with no name attached. Throws with a readable reason if
   * a trip is live or a wallet balance is outstanding — that money is hers,
   * and destroying it alongside her data would not be a privacy feature.
   */
  deleteAccount(reason?: string): Promise<void>;
}

export class MockUserService implements IUserService {
  async getCurrent(): Promise<User> {
    await delay(200);
    return mockUser();
  }
  async updateProfile(patch: Partial<User["profile"]>): Promise<User> {
    await delay(300);
    const base = mockUser();
    return { ...base, profile: { ...base.profile, ...patch } };
  }
  async deleteAccount(): Promise<void> {
    await delay(400);
  }
}
