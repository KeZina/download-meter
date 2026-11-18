#!/usr/bin/env node
import { parseArgs } from "node:util";
import logger from "silly-logger";
import { formatBytes, formatDuration, formatSpeed, meterUrl } from "./benchmark.js";
import { RequestTimeoutError } from "./errors.js";
import { parseUrl } from "./guard.js";

logger.timeFormat("YYYY-MM-DD HH:mm:ss");

const DEFAULT_URL = "https://picsum.photos/1200/800";
const DEFAULT_COUNT = 10;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_SIZE_BYTES = 100_000_000;

interface CliOptions {
  url: URL;
  count: number;
  timeoutMs: number;
  maxSizeBytes: number;
}

function parseCliOptions(): CliOptions {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      count: { type: "string", short: "c", default: String(DEFAULT_COUNT) },
      timeout: {
        type: "string",
        short: "t",
        default: String(DEFAULT_TIMEOUT_MS),
      },
      "max-size": { type: "string", default: String(DEFAULT_MAX_SIZE_BYTES) },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  const rawUrl = positionals[0] ?? DEFAULT_URL;
  return {
    url: parseUrl(rawUrl),
    count: parsePositiveInt(values.count, "--count"),
    timeoutMs: parsePositiveInt(values.timeout, "--timeout"),
    maxSizeBytes: parsePositiveInt(values["max-size"], "--max-size"),
  };
}

function parsePositiveInt(raw: string | boolean, flagName: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flagName} must be a positive integer`);
  }
  return value;
}

function printUsage(): void {
  logger.info(
    [
      "Usage: npm run knock -- [url] [options]",
      "",
      "Arguments:",
      "  [url]                 Target to knock on (http/https).",
      `                        Default: ${DEFAULT_URL}`,
      "",
      "Options:",
      "  -c, --count <n>       Number of consecutive requests (default: 10)",
      "  -t, --timeout <ms>    Timeout per request in milliseconds (default: 15000)",
      "      --max-size <b>    Abort a response larger than this many bytes (default: 100000000)",
      "  -h, --help            Show this help",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  let options: CliOptions;
  try {
    options = parseCliOptions();
  } catch (error) {
    printUsage();
    logger.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  logger.startup("download-meter is warming up...");
  logger.info(`Knocking on ${options.url.href} ${options.count} times, one knock at a time...`);

  const wallStartedAt = performance.now();
  try {
    const summary = await meterUrl(
      {
        url: options.url,
        count: options.count,
        timeoutMs: options.timeoutMs,
        maxBytes: options.maxSizeBytes,
      },
      (index, count, result) => {
        logger.success(
          `Knock ${String(index).padStart(String(count).length, "0")}/${count}: ` +
            `HTTP ${result.status}, ${formatBytes(result.bytes)} in ${formatDuration(result.durationMs)}`,
        );
      },
    );

    logger.custom("RESULTS", "green", "grey", "All knocks completed:");
    logger.info(
      `  Total downloaded : ${formatBytes(summary.totalBytes)} across ${summary.count} requests`,
    );
    logger.info(`  Average request time: ${formatDuration(summary.averageRequestTimeMs)}`);
    logger.info(`  Total wall time  : ${formatDuration(summary.totalWallTimeMs)}`);
    logger.info(
      `  Smallest / largest response: ${formatBytes(summary.smallestKnockBytes)} / ${formatBytes(summary.largestKnockBytes)}`,
    );
    logger.custom(
      "SPEED",
      "blurple",
      "grey",
      `Average download speed: ${formatSpeed(summary.averageSpeedBytesPerSecond)} ` +
        `(${formatSpeed(summary.wallSpeedBytesPerSecond)} including per-request overhead)`,
    );
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    if (error instanceof RequestTimeoutError) {
      logger.error(`Knock failed - ${message} (adjust --timeout if the target is slow)`);
    } else {
      logger.crash(`Knock failed - ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  logger.success(`Done in ${formatDuration(performance.now() - wallStartedAt)}. Happy knocking!`);
}

process.on("unhandledRejection", (reason) => {
  logger.crash(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  process.exitCode = 1;
});

main().catch((error: unknown) => {
  logger.crash(`Fatal: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
  process.exitCode = 1;
});
