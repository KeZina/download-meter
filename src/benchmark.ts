import { knock } from "./knocker.js";
import type { KnockListener, KnockResult, MeterOptions, MeterSummary } from "./types/index.js";

export async function meterUrl(
  options: MeterOptions,
  onKnock: KnockListener,
): Promise<MeterSummary> {
  const { url, count, timeoutMs, maxBytes } = options;
  const results: KnockResult[] = [];
  const wallStartedAt = performance.now();
  for (let index = 1; index <= count; index += 1) {
    const result = await knock({ url, timeoutMs, maxBytes });
    results.push(result);
    onKnock(index, count, result);
  }
  const totalWallTimeMs = performance.now() - wallStartedAt;
  const totalBytes = results.reduce((sum, result) => sum + result.bytes, 0);
  const totalDownloadTimeMs = results.reduce((sum, result) => sum + result.durationMs, 0);
  const averageRequestTimeMs = totalDownloadTimeMs / results.length;
  const averageSpeedBytesPerSecond =
    totalDownloadTimeMs > 0 ? totalBytes / (totalDownloadTimeMs / 1000) : 0;
  const wallSpeedBytesPerSecond = totalWallTimeMs > 0 ? totalBytes / (totalWallTimeMs / 1000) : 0;
  const knockSizes = results.map((result) => result.bytes);
  return {
    count: results.length,
    totalBytes,
    totalDownloadTimeMs,
    totalWallTimeMs,
    averageRequestTimeMs,
    averageSpeedBytesPerSecond,
    wallSpeedBytesPerSecond,
    smallestKnockBytes: Math.min(...knockSizes),
    largestKnockBytes: Math.max(...knockSizes),
  };
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1000 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }
  if (unitIndex === 0) {
    return `${Math.round(value)} ${BYTE_UNITS[unitIndex]}`;
  }
  return `${value.toFixed(2)} ${BYTE_UNITS[unitIndex]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${ms.toFixed(2)} ms`;
  }
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}
