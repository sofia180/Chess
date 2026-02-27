import type { Asset } from '@prisma/client';
import type { GameType } from '../../types';

export type QueueKey = `${GameType}:${Asset}:${string}`;

export function queueKey(input: { gameType: GameType; stakeAsset: Asset; stakeAmount: string }): QueueKey {
  return `${input.gameType}:${input.stakeAsset}:${input.stakeAmount}`;
}

type Entry = { userId: string; roomId: string; createdAt: number };

export class MatchmakingQueue {
  private q = new Map<QueueKey, Entry[]>();

  enqueue(key: QueueKey, entry: Entry) {
    const arr = this.q.get(key) ?? [];
    arr.push(entry);
    this.q.set(key, arr);
  }

  dequeueOther(key: QueueKey, userId: string): Entry | null {
    const arr = this.q.get(key);
    if (!arr?.length) return null;
    const idx = arr.findIndex((e) => e.userId !== userId);
    if (idx === -1) return null;
    const [picked] = arr.splice(idx, 1);
    if (!arr.length) this.q.delete(key);
    else this.q.set(key, arr);
    return picked ?? null;
  }

  removeUser(userId: string): Entry[] {
    const removed: Entry[] = [];
    for (const [k, arr] of this.q.entries()) {
      const keep: Entry[] = [];
      for (const e of arr) {
        if (e.userId === userId) removed.push(e);
        else keep.push(e);
      }
      if (!keep.length) this.q.delete(k);
      else this.q.set(k, keep);
    }
    return removed;
  }
}

