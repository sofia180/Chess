import type { Asset } from '@prisma/client';

export type DepositIntent = {
  userId: string;
  asset: Asset;
  amount: string;
};

export type WithdrawIntent = {
  userId: string;
  asset: Asset;
  amount: string;
  address: string;
};

export type DepositAddress = { asset: Asset; address: string };

export interface CryptoAdapter {
  readonly asset: Asset;
  getDepositAddress(userId: string): Promise<DepositAddress>;
  requestWithdraw(intent: WithdrawIntent): Promise<{ providerWithdrawalId: string }>;
  // In production you'd also expose:
  // - startDepositListener()
  // - confirmations, chain re-org handling, etc.
}

