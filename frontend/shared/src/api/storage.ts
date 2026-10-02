export interface TokenStorage {
  getAccessToken(): Promise<string | null> | string | null;
  getRefreshToken(): Promise<string | null> | string | null;
  setTokens(accessToken: string, refreshToken: string): Promise<void> | void;
  clearTokens(): Promise<void> | void;
}

export class MemoryTokenStorage implements TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }
}

export class LocalStorageTokenStorage implements TokenStorage {
  private accessKey: string;
  private refreshKey: string;

  constructor(prefix: string = 'lottery_') {
    this.accessKey = `${prefix}access_token`;
    this.refreshKey = `${prefix}refresh_token`;
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(this.accessKey);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(this.refreshKey);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(this.accessKey, accessToken);
    localStorage.setItem(this.refreshKey, refreshToken);
  }

  clearTokens(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.refreshKey);
  }
}
