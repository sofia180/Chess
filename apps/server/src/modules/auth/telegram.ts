import crypto from 'crypto';

type InitDataUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

export function verifyTelegramInitData(params: Record<string, string>, botToken: string): boolean {
  const hash = params.hash;
  if (!hash) return false;
  if (hash.length !== 64) return false;

  const dataPairs: string[] = [];
  for (const key of Object.keys(params).sort()) {
    if (key === 'hash') continue;
    dataPairs.push(`${key}=${params[key]}`);
  }
  const dataCheckString = dataPairs.join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function extractTelegramUser(params: Record<string, string>): InitDataUser | null {
  const userStr = params.user;
  if (!userStr) return null;
  try {
    const parsed = JSON.parse(userStr) as InitDataUser;
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

