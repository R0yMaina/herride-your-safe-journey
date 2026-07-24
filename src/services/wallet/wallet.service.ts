export interface WalletBalance {
  readonly balance: number;
  readonly currency: string;
}

export interface WalletTransaction {
  readonly id: string;
  readonly type: string;
  readonly amount: number;
  readonly description: string | null;
  readonly balanceAfter: number | null;
  readonly createdAt: string;
}

export interface IWalletService {
  getBalance(): Promise<WalletBalance>;
  listTransactions(): Promise<readonly WalletTransaction[]>;
  /** Dev-only top-up (real payment providers are out of scope for v1). */
  topUp(amount: number): Promise<WalletBalance>;
}

const delay = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms));

export class MockWalletService implements IWalletService {
  private balance = 4820;
  async getBalance() {
    await delay();
    return { balance: this.balance, currency: "KES" };
  }
  async listTransactions() {
    await delay();
    return [];
  }
  async topUp(amount: number) {
    await delay();
    this.balance += amount;
    return { balance: this.balance, currency: "KES" };
  }
}
