import { appConfig } from "@/config/app.config";
import { logger } from "@/lib/logger";
import { authInterceptor, loggingInterceptor } from "./interceptors";
import {
  ApiError,
  type ApiResponse,
  type RequestInterceptor,
  type RequestOptions,
  type ResponseInterceptor,
} from "./types";

class ApiClient {
  private readonly baseUrl: string;
  private readonly requestInterceptors: RequestInterceptor[] = [authInterceptor];
  private readonly responseInterceptors: ResponseInterceptor[] = [loggingInterceptor];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  addRequestInterceptor(i: RequestInterceptor) {
    this.requestInterceptors.push(i);
  }
  addResponseInterceptor(i: ResponseInterceptor) {
    this.responseInterceptors.push(i);
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const attempts = options.retry === false ? 1 : appConfig.api.retry.attempts;
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await this.dispatch<T>(path, options);
      } catch (error) {
        lastError = error;
        if (error instanceof ApiError && error.status < 500) throw error;
        if (attempt === attempts) break;
        await new Promise((r) => setTimeout(r, appConfig.api.retry.backoffMs * attempt));
      }
    }
    throw lastError instanceof Error ? lastError : new ApiError("Unknown error", 0, "unknown");
  }

  private async dispatch<T>(path: string, options: RequestOptions): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? appConfig.api.timeoutMs,
    );
    const signal = options.signal ?? controller.signal;
    let url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    let init: RequestInit = {
      method: options.method ?? "GET",
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
      body: options.body != null ? JSON.stringify(options.body) : undefined,
      signal,
    };
    for (const interceptor of this.requestInterceptors)
      ({ url, init } = await interceptor(url, init));
    try {
      let response = await fetch(url, init);
      for (const interceptor of this.responseInterceptors) response = await interceptor(response);
      if (!response.ok)
        throw new ApiError(response.statusText, response.status, `http_${response.status}`);
      const data = (response.status === 204 ? null : await response.json()) as T;
      return { data, status: response.status };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error("api.request.failed", { path, error: (error as Error).message });
      throw new ApiError((error as Error).message, 0, "network_error");
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const apiClient = new ApiClient(appConfig.api.baseUrl);
export { ApiError };
