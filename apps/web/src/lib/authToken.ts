const KEY = 'tcg_token_v1';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(KEY);
}

