import type { CryptoAdapter, DepositAddress, WithdrawIntent } from '../types';
import type { Asset } from '@prisma/client';

export class MockCryptoAdapter implements CryptoAdapter {
  constructor(public readonly asset: Asset) {}

  async getDepositAddress(userId: string): Promise<DepositAddress> {
    return {
      asset: this.asset,
      address: `mock:${this.asset.toLowerCase()}:${userId}`
    };
  }

  async requestWithdraw(_intent: WithdrawIntent): Promise<{ providerWithdrawalId: string }> {
    return { providerWithdrawalId: `mock_wd_${Date.now()}` };
  }
}

