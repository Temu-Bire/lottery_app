import { TokenStorage } from '@lottery/shared';

export class MobileSecureTokenStorage implements TokenStorage {
  private inMemoryAccess: string | null = null;
  private inMemoryRefresh: string | null = null;

  async getAccessToken(): Promise<string | null> {
    return this.inMemoryAccess;
  }

  async getRefreshToken(): Promise<string | null> {
    return this.inMemoryRefresh;
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.inMemoryAccess = accessToken;
    this.inMemoryRefresh = refreshToken;
  }

  async clearTokens(): Promise<void> {
    this.inMemoryAccess = null;
    this.inMemoryRefresh = null;
  }
}
