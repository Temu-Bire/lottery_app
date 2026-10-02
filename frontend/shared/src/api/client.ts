import { ApiError } from './errors.js';
import { TokenStorage, LocalStorageTokenStorage } from './storage.js';
import { ApiResponse, PaginatedResult } from '../types/api.js';
import { TokenPair, AuthSuccessResponse } from '../types/auth.js';

export interface ApiClientConfig {
  baseUrl: string;
  storage?: TokenStorage;
  timeoutMs?: number;
  onAuthFailure?: () => void;
  onTokenRefresh?: (tokens: TokenPair) => void;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, unknown>;
  requiresAuth?: boolean;
  timeoutMs?: number;
}

export class ApiClient {
  private baseUrl: string;
  private storage: TokenStorage;
  private timeoutMs: number;
  private onAuthFailure?: () => void;
  private onTokenRefresh?: (tokens: TokenPair) => void;

  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<{
    resolve: (token: string) => void;
    reject: (err: ApiError) => void;
  }> = [];

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.storage = config.storage || new LocalStorageTokenStorage();
    this.timeoutMs = config.timeoutMs || 15000;
    this.onAuthFailure = config.onAuthFailure;
    this.onTokenRefresh = config.onTokenRefresh;
  }

  public getStorage(): TokenStorage {
    return this.storage;
  }

  public setStorage(storage: TokenStorage): void {
    this.storage = storage;
  }

  public setAuthFailureHandler(handler: () => void): void {
    this.onAuthFailure = handler;
  }

  public setTokenRefreshHandler(handler: (tokens: TokenPair) => void): void {
    this.onTokenRefresh = handler;
  }

  private buildUrl(endpoint: string, query?: Record<string, unknown>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${this.baseUrl}${cleanEndpoint}`;

    if (query && Object.keys(query).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    return url;
  }

  private async executeFetch(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw ApiError.timeoutError();
      }
      throw ApiError.networkError((err as Error)?.message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await this.storage.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError({
        status: 401,
        code: 'NO_REFRESH_TOKEN',
        message: 'No refresh token available',
      });
    }

    const refreshUrl = `${this.baseUrl}/auth/refresh`;
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      await this.storage.clearTokens();
      if (this.onAuthFailure) {
        this.onAuthFailure();
      }
      throw ApiError.fromResponse(response.status, data);
    }

    // Auth controller returns { success: true, data: { user: {...}, tokens: {...} } }
    const authData = (data as ApiResponse<AuthSuccessResponse>).data;
    const newTokens = authData?.tokens;
    if (!newTokens?.accessToken) {
      await this.storage.clearTokens();
      throw ApiError.fromResponse(500, { message: 'Malformed refresh response from server' });
    }

    await this.storage.setTokens(newTokens.accessToken, newTokens.refreshToken);
    if (this.onTokenRefresh) {
      this.onTokenRefresh(newTokens);
    }

    return newTokens.accessToken;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      body,
      query,
      requiresAuth = true,
      timeoutMs = this.timeoutMs,
      headers: customHeaders = {},
      ...fetchOptions
    } = options;

    const url = this.buildUrl(endpoint, query);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((customHeaders as Record<string, string>) || {}),
    };

    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (requiresAuth) {
      const accessToken = await this.storage.getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const payload = body !== undefined
      ? (body instanceof FormData ? body : JSON.stringify(body))
      : undefined;

    const execute = async (authHeader?: string): Promise<Response> => {
      const reqHeaders = { ...headers };
      if (authHeader) {
        reqHeaders['Authorization'] = authHeader;
      }
      return this.executeFetch(
        url,
        {
          ...fetchOptions,
          headers: reqHeaders,
          body: payload,
        },
        timeoutMs,
      );
    };

    let response = await execute();

    // Handle 401 Unauthorized for authenticated endpoints
    if (response.status === 401 && requiresAuth && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const newAccessToken = await this.refreshAccessToken();
          this.refreshSubscribers.forEach((sub) => sub.resolve(newAccessToken));
          this.refreshSubscribers = [];
          // Retry original request with newly refreshed token
          response = await execute(`Bearer ${newAccessToken}`);
        } catch (refreshErr) {
          const err = refreshErr instanceof ApiError ? refreshErr : ApiError.fromResponse(401, refreshErr);
          this.refreshSubscribers.forEach((sub) => sub.reject(err));
          this.refreshSubscribers = [];
          throw err;
        } finally {
          this.isRefreshing = false;
        }
      } else {
        // Already refreshing: queue this request until refresh succeeds
        const newAccessToken = await new Promise<string>((resolve, reject) => {
          this.refreshSubscribers.push({ resolve, reject });
        });
        response = await execute(`Bearer ${newAccessToken}`);
      }
    }

    // Parse JSON
    let responseData: ApiResponse<T>;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { success: response.ok, message: text } as ApiResponse<T>;
    }

    if (!response.ok || responseData.success === false) {
      throw ApiError.fromResponse(response.status, responseData);
    }

    return (responseData.data !== undefined ? responseData.data : responseData) as T;
  }

  public async requestPaginated<T>(endpoint: string, options: RequestOptions = {}): Promise<PaginatedResult<T>> {
    const {
      body,
      query,
      requiresAuth = true,
      timeoutMs = this.timeoutMs,
      headers: customHeaders = {},
      ...fetchOptions
    } = options;

    const url = this.buildUrl(endpoint, query);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((customHeaders as Record<string, string>) || {}),
    };

    if (requiresAuth) {
      const accessToken = await this.storage.getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const response = await this.executeFetch(
      url,
      {
        ...fetchOptions,
        headers,
      },
      timeoutMs,
    );

    let responseData: ApiResponse<T[]>;
    try {
      responseData = await response.json();
    } catch {
      throw ApiError.fromResponse(response.status, { message: 'Failed to parse JSON response' });
    }

    if (!response.ok || !responseData.success) {
      throw ApiError.fromResponse(response.status, responseData);
    }

    return {
      data: responseData.data || [],
      pagination: responseData.pagination || {
        page: 1,
        limit: responseData.data?.length || 0,
        total: responseData.data?.length || 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  public get<T>(endpoint: string, query?: Record<string, unknown>, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', query });
  }

  public getPaginated<T>(endpoint: string, query?: Record<string, unknown>, options: RequestOptions = {}): Promise<PaginatedResult<T>> {
    return this.requestPaginated<T>(endpoint, { ...options, method: 'GET', query });
  }

  public post<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public patch<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
