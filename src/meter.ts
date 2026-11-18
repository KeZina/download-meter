import { knock } from "./knocker.js";
import type {
  KnockListener,
  KnockResult,
  MeterOptions,
  MeterSummary,
} from "./types/index.js";

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
  const totalDownloadTimeMs = results.reduce(
    (sum, result) => sum + result.durationMs,
    0,
  );
  const averageRequestTimeMs = totalDownloadTimeMs / results.length;
  const averageSpeedBytesPerSecond = totalDownloadTimeMs > 0
    ? (totalBytes / (totalDownloadTimeMs / 1000))
    : 0;
  const wallSpeedBytesPerSecond = totalWallTimeMs > 0
    ? (totalBytes / (totalWallTimeMs / 1000))
    : 0;
  const knockSizes = results.map((result) => result.bytes);
  return {
    url: url.href,
    count: results.length,
    results,
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
