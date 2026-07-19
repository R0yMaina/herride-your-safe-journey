import { logger } from "@/lib/logger";
import type { RequestInterceptor, ResponseInterceptor } from "./types";

export const authInterceptor: RequestInterceptor = (url, init) => ({ url, init });

export const loggingInterceptor: ResponseInterceptor = (response) => {
  if (!response.ok)
    logger.warn("api.response.non_ok", { status: response.status, url: response.url });
  return response;
};
