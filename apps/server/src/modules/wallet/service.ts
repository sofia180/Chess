import { Prisma } from '@prisma/client';
import type { Asset } from '@prisma/client';
import { prisma } from '../../db';
import { env } from '../../config';

export function d(value: string | number | Prisma.Decimal): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(value);
}

export function assertPositive(amount: Prisma.Decimal) {
  if (amount.lte(0)) throw new Error('Amount must be positive');
}

async function getWalletAssetOrThrow(tx: Prisma.TransactionClient, userId: string, asset: Asset) {
  const wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error('Wallet missing');
  const wa = await tx.walletAsset.findUnique({
    where: { walletId_asset: { walletId: wallet.id, asset } }
  });
  if (!wa) throw new Error('Wallet asset missing');
  return { wallet, wa };
}

export async function getBalances(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: { assets: true }
  });
  if (!wallet) throw new Error('Wallet missing');
  return wallet.assets.map((a) => ({
    asset: a.asset,
    balanceAvail: a.balanceAvail.toString(),
    balanceLocked: a.balanceLocked.toString()
  }));
}

export async function deposit(userId: string, asset: Asset, amountStr: string, meta?: Prisma.InputJsonValue) {
  const amount = d(amountStr);
  assertPositive(amount);
  return prisma.$transaction(async (tx) => {
    const { wa } = await getWalletAssetOrThrow(tx, userId, asset);
    await tx.walletAsset.update({
      where: { id: wa.id },
      data: { balanceAvail: { increment: amount } }
    });
    await tx.transaction.create({
      data: { userId, type: 'DEPOSIT', asset, amount, status: 'COMPLETED', meta }
    });
  });
}

export async function withdraw(userId: string, asset: Asset, amountStr: string, meta?: Prisma.InputJsonValue) {
  const amount = d(amountStr);
  assertPositive(amount);
  return prisma.$transaction(async (tx) => {
    const { wa } = await getWalletAssetOrThrow(tx, userId, asset);
    if (wa.balanceAvail.lt(amount)) throw new Error('Insufficient balance');
    await tx.walletAsset.update({
      where: { id: wa.id },
      data: { balanceAvail: { decrement: amount } }
    });
    await tx.transaction.create({
      data: { userId, type: 'WITHDRAW', asset, amount, status: 'PENDING', meta }
    });
  });
}

export async function lockForGame(userId: string, asset: Asset, amountStr: string, gameId: string) {
  const amount = d(amountStr);
  assertPositive(amount);
  return prisma.$transaction(async (tx) => {
    const { wa } = await getWalletAssetOrThrow(tx, userId, asset);
    if (wa.balanceAvail.lt(amount)) throw new Error('Insufficient balance');
    await tx.walletAsset.update({
      where: { id: wa.id },
      data: { balanceAvail: { decrement: amount }, balanceLocked: { increment: amount } }
    });
    await tx.transaction.create({
      data: { userId, type: 'LOCK', asset, amount, status: 'COMPLETED', meta: { gameId } }
    });
  });
}

export async function unlockFromGame(userId: string, asset: Asset, amount: Prisma.Decimal, gameId: string) {
  if (amount.lte(0)) return;
  return prisma.$transaction(async (tx) => {
    const { wa } = await getWalletAssetOrThrow(tx, userId, asset);
    if (wa.balanceLocked.lt(amount)) throw new Error('Locked balance underflow');
    await tx.walletAsset.update({
      where: { id: wa.id },
      data: { balanceLocked: { decrement: amount }, balanceAvail: { increment: amount } }
    });
    await tx.transaction.create({
      data: { userId, type: 'UNLOCK', asset, amount, status: 'COMPLETED', meta: { gameId } }
    });
  });
}

export type Settlement = {
  payoutAmount: string;
  feeAmount: string;
  referralRewardAmount?: string;
};

export async function settleWinnerTakeAll(params: {
  gameId: string;
  asset: Asset;
  stakeAmountStr: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null; // null = draw
}) {
  const stake = d(params.stakeAmountStr);
  assertPositive(stake);
  const pot = stake.mul(2);
  const fee = pot.mul(env.PLATFORM_FEE_BPS).div(10_000);
  const payout = pot.sub(fee);

  return prisma.$transaction(async (tx) => {
    const p1 = await getWalletAssetOrThrow(tx, params.player1Id, params.asset);
    const p2 = await getWalletAssetOrThrow(tx, params.player2Id, params.asset);

    // draw: refund stake to both
    if (!params.winnerId) {
      if (p1.wa.balanceLocked.lt(stake) || p2.wa.balanceLocked.lt(stake)) throw new Error('Locked stake missing');
      await tx.walletAsset.update({
        where: { id: p1.wa.id },
        data: { balanceLocked: { decrement: stake }, balanceAvail: { increment: stake } }
      });
      await tx.walletAsset.update({
        where: { id: p2.wa.id },
        data: { balanceLocked: { decrement: stake }, balanceAvail: { increment: stake } }
      });
      await tx.transaction.createMany({
        data: [
          { userId: params.player1Id, type: 'UNLOCK', asset: params.asset, amount: stake, status: 'COMPLETED', meta: { gameId: params.gameId, reason: 'draw' } },
          { userId: params.player2Id, type: 'UNLOCK', asset: params.asset, amount: stake, status: 'COMPLETED', meta: { gameId: params.gameId, reason: 'draw' } }
        ]
      });
      return { payoutAmount: stake.toString(), feeAmount: '0' } satisfies Settlement;
    }

    const winnerId = params.winnerId;
    const loserId = winnerId === params.player1Id ? params.player2Id : params.player1Id;

    const winnerWA = winnerId === params.player1Id ? p1.wa : p2.wa;
    const loserWA = loserId === params.player1Id ? p1.wa : p2.wa;

    if (winnerWA.balanceLocked.lt(stake) || loserWA.balanceLocked.lt(stake)) throw new Error('Locked stake missing');

    // remove locked stake from both (stake is consumed into pot)
    await tx.walletAsset.update({ where: { id: winnerWA.id }, data: { balanceLocked: { decrement: stake } } });
    await tx.walletAsset.update({ where: { id: loserWA.id }, data: { balanceLocked: { decrement: stake } } });

    // credit payout to winner
    await tx.walletAsset.update({ where: { id: winnerWA.id }, data: { balanceAvail: { increment: payout } } });

    // record transactions
    await tx.transaction.createMany({
      data: [
        { userId: winnerId, type: 'PAYOUT', asset: params.asset, amount: payout, status: 'COMPLETED', meta: { gameId: params.gameId } },
        { userId: winnerId, type: 'FEE', asset: params.asset, amount: fee, status: 'COMPLETED', meta: { gameId: params.gameId } }
      ]
    });

    // referral reward: 10% of the platform fee generated by a referred user's games.
    // MVP rule: split the fee equally across participants, pay referrer share per participant.
    const feePerPlayer = fee.div(2);
    const referralSharePerPlayer = feePerPlayer.mul(env.REFERRAL_FEE_SHARE_BPS).div(10_000);
    let referralRewardTotal = new Prisma.Decimal(0);

    const participants = [params.player1Id, params.player2Id] as const;
    for (const feeUserId of participants) {
      if (referralSharePerPlayer.lte(0)) continue;
      const feeUser = await tx.user.findUnique({ where: { id: feeUserId }, select: { referredById: true } });
      if (!feeUser?.referredById) continue;

      const refWallet = await tx.wallet.findUnique({ where: { userId: feeUser.referredById } });
      if (!refWallet) continue;
      const refWA = await tx.walletAsset.findUnique({
        where: { walletId_asset: { walletId: refWallet.id, asset: params.asset } }
      });
      if (!refWA) continue;

      await tx.walletAsset.update({ where: { id: refWA.id }, data: { balanceAvail: { increment: referralSharePerPlayer } } });
      await tx.transaction.create({
        data: {
          userId: feeUser.referredById,
          type: 'REFERRAL_REWARD',
          asset: params.asset,
          amount: referralSharePerPlayer,
          status: 'COMPLETED',
          meta: { gameId: params.gameId, fromUserId: feeUserId }
        }
      });
      await tx.referralReward.create({
        data: {
          referrerId: feeUser.referredById,
          userId: feeUserId,
          amount: referralSharePerPlayer,
          asset: params.asset,
          gameId: params.gameId
        }
      });
      referralRewardTotal = referralRewardTotal.add(referralSharePerPlayer);
    }

    return {
      payoutAmount: payout.toString(),
      feeAmount: fee.toString(),
      referralRewardAmount: referralRewardTotal.gt(0) ? referralRewardTotal.toString() : undefined
    } satisfies Settlement;
  });
}

