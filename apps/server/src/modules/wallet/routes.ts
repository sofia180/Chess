import { Router } from 'express';
import { z } from 'zod';
import type { Asset } from '@prisma/client';
import { requireAuth, type AuthedRequest } from '../auth/middleware';
import * as wallet from './service';
import { CRYPTO_ADAPTERS } from '../crypto/registry';

export const walletRouter = Router();

walletRouter.get('/balances', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const balances = await wallet.getBalances(userId);
  return res.json({ ok: true, balances });
});

walletRouter.get('/deposit-address', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const Q = z.object({ asset: z.enum(['USDT', 'ETH', 'POLYGON']) });
  const { asset } = Q.parse(req.query);
  const adapter = CRYPTO_ADAPTERS[asset as Asset];
  const addr = await adapter.getDepositAddress(userId);
  return res.json({ ok: true, address: addr.address });
});

walletRouter.post('/deposit', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const Body = z.object({
    asset: z.enum(['USDT', 'ETH', 'POLYGON']),
    amount: z.string().min(1)
  });
  const { asset, amount } = Body.parse(req.body);

  // MVP: mock deposit confirmation. In production, credit after on-chain confirmations.
  await wallet.deposit(userId, asset as Asset, amount, { provider: 'mock', confirmed: true });
  return res.json({ ok: true });
});

walletRouter.post('/withdraw', requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const Body = z.object({
    asset: z.enum(['USDT', 'ETH', 'POLYGON']),
    amount: z.string().min(1),
    address: z.string().min(6)
  });
  const { asset, amount, address } = Body.parse(req.body);
  const adapter = CRYPTO_ADAPTERS[asset as Asset];
  const wd = await adapter.requestWithdraw({ userId, asset: asset as Asset, amount, address });
  await wallet.withdraw(userId, asset as Asset, amount, { address, provider: 'mock', providerWithdrawalId: wd.providerWithdrawalId });
  return res.json({ ok: true });
});

