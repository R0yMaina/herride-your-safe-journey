import type { User } from "@/types/user";
import { delay, mockUser } from "./mock-data";

export interface IUserService {
  getCurrent(): Promise<User>;
  updateProfile(patch: Partial<User["profile"]>): Promise<User>;
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
}
