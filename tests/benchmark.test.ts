import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { meterUrl } from "../src/benchmark.js";
import { PAYLOAD, startTestServer } from "./helpers.js";

let base: string;
let closeServer: () => Promise<void>;

before(async () => {
  const server = await startTestServer();
  base = server.base;
  closeServer = server.close;
});

after(async () => {
  await closeServer();
});

describe("meterUrl", () => {
  it("performs the requested number of consecutive knocks", async () => {
    let knocks = 0;
    const summary = await meterUrl(
      {
        url: new URL(base + "/img"),
        count: 3,
        timeoutMs: 2_000,
        maxBytes: 1_000_000,
      },
      () => {
        knocks += 1;
      },
    );
    assert.equal(summary.count, 3);
    assert.equal(knocks, 3);
  });
  it("sums the downloaded bytes and averages the request time", async () => {
    const summary = await meterUrl(
      {
        url: new URL(base + "/img"),
        count: 3,
        timeoutMs: 2_000,
        maxBytes: 1_000_000,
      },
      () => {},
    );
    assert.equal(summary.totalBytes, PAYLOAD.length * 3);
    assert.equal(summary.averageRequestTimeMs, summary.totalDownloadTimeMs / 3);
    assert.ok(summary.averageSpeedBytesPerSecond > 0);
    assert.ok(summary.wallSpeedBytesPerSecond > 0);
  });
  it("tracks the smallest and largest knock", async () => {
    const summary = await meterUrl(
      {
        url: new URL(base + "/img"),
        count: 2,
        timeoutMs: 2_000,
        maxBytes: 1_000_000,
      },
      () => {},
    );
    assert.equal(summary.smallestKnockBytes, PAYLOAD.length);
    assert.equal(summary.largestKnockBytes, PAYLOAD.length);
  });
});
