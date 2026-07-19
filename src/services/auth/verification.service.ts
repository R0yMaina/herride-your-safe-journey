import { delay } from "./mock-data";

export interface IVerificationService {
  sendEmailLink(email: string): Promise<void>;
  confirmEmail(token: string): Promise<void>;
  sendPhoneOtp(phone: string): Promise<string>;
  confirmPhoneOtp(verificationId: string, code: string): Promise<void>;
}

export class MockVerificationService implements IVerificationService {
  async sendEmailLink(_email: string) {
    await delay(400);
  }
  async confirmEmail(_token: string) {
    await delay(400);
  }
  async sendPhoneOtp(_phone: string) {
    await delay(400);
    return crypto.randomUUID();
  }
  async confirmPhoneOtp(_id: string, code: string) {
    await delay(400);
    if (code === "000000") throw new Error("Invalid code");
  }
}
