import type { KnockResult } from "./knock.js";

export interface MeterOptions {
  url: URL;
  count: number;
  timeoutMs: number;
  maxBytes: number;
}

export type KnockListener = (
  index: number,
  count: number,
  result: KnockResult,
) => void;

export interface MeterSummary {
  url: string;
  count: number;
  results: KnockResult[];
  totalBytes: number;
  totalDownloadTimeMs: number;
  totalWallTimeMs: number;
  averageRequestTimeMs: number;
  averageSpeedBytesPerSecond: number;
  wallSpeedBytesPerSecond: number;
  smallestKnockBytes: number;
  largestKnockBytes: number;
}
