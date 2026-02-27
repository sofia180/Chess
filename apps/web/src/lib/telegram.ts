import WebApp from '@twa-dev/sdk';

export function isInTelegram(): boolean {
  if (typeof window === 'undefined') return false;
  // @twa-dev/sdk gracefully handles missing Telegram
  return Boolean((window as any)?.Telegram?.WebApp);
}

export function getTelegramInitData(): string | null {
  try {
    const initData = WebApp.initData;
    return initData?.length ? initData : null;
  } catch {
    return null;
  }
}

export function telegramReady() {
  try {
    WebApp.ready();
    WebApp.expand();
  } catch {
    // ignore
  }
}

