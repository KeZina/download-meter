export class InvalidUrlError extends Error {
  constructor(url: string, reason: string) {
    super(`Invalid URL "${url}": ${reason}`);
    this.name = "InvalidUrlError";
  }
}

export class HttpStatusError extends Error {
  constructor(
    url: string,
    readonly status: number,
    readonly statusText: string,
  ) {
    super(`Request to "${url}" returned HTTP ${status} ${statusText}`);
    this.name = "HttpStatusError";
  }
}

export class UnsafeHostError extends Error {
  constructor(url: string, readonly host: string, readonly detail: string) {
    super(
      `Host "${host}" of "${url}" is ${detail} and is blocked as a potentially malicious target. Pass --allow-private to permit it (e.g. for local testing).`,
    );
    this.name = "UnsafeHostError";
  }
}

export class ResponseTooLargeError extends Error {
  constructor(url: string, readonly limitBytes: number) {
    super(
      `Response from "${url}" exceeded the size limit of ${limitBytes} bytes. Download aborted as a possible oversized/malicious payload.`,
    );
    this.name = "ResponseTooLargeError";
  }
}

export class RequestTimeoutError extends Error {
  constructor(url: string, readonly timeoutMs: number) {
    super(`Request to "${url}" timed out after ${timeoutMs} ms`);
    this.name = "RequestTimeoutError";
  }
}

export class NetworkError extends Error {
  constructor(url: string, cause: unknown) {
    super(`Network request to "${url}" failed: ${describeCause(cause)}`);
    this.name = "NetworkError";
    this.cause = cause;
  }
}

function describeCause(cause: unknown): string {
  if (cause instanceof Error) {
    return `${cause.name}: ${cause.message}`;
  }
  return String(cause);
}
