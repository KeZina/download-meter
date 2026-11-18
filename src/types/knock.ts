export interface KnockOptions {
  url: URL;
  timeoutMs: number;
  maxBytes: number;
}

export interface KnockResult {
  status: number;
  bytes: number;
  durationMs: number;
}
