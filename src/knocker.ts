import {
  HttpStatusError,
  NetworkError,
  RequestTimeoutError,
  ResponseTooLargeError,
} from "./errors.js";
import type { KnockOptions, KnockResult } from "./types/index.js";

export async function knock({
  url,
  timeoutMs,
  maxBytes,
}: KnockOptions): Promise<KnockResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "download-meter/1.0" },
    });
    const statusMs = performance.now() - startedAt;
    if (!response.ok) {
      throw new HttpStatusError(url.href, response.status, response.statusText);
    }
    if (!response.body) {
      return { status: response.status, bytes: 0, durationMs: statusMs };
    }
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.byteLength;
      if (bytes > maxBytes) {
        controller.abort();
        throw new ResponseTooLargeError(url.href, maxBytes);
      }
    }
    return { status: response.status, bytes, durationMs: performance.now() - startedAt };
  } catch (error) {
    if (isOwnError(error)) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new RequestTimeoutError(url.href, timeoutMs);
    }
    throw new NetworkError(url.href, error);
  } finally {
    clearTimeout(timer);
  }
}

function isOwnError(error: unknown): boolean {
  return (
    error instanceof HttpStatusError ||
    error instanceof ResponseTooLargeError ||
    error instanceof NetworkError ||
    error instanceof RequestTimeoutError
  );
}
