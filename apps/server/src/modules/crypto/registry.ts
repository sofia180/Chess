import type { Asset } from '@prisma/client';
import { MockCryptoAdapter } from './adapters/mock';
import type { CryptoAdapter } from './types';

export const CRYPTO_ADAPTERS: Record<Asset, CryptoAdapter> = {
  USDT: new MockCryptoAdapter('USDT'),
  ETH: new MockCryptoAdapter('ETH'),
  POLYGON: new MockCryptoAdapter('POLYGON')
};

