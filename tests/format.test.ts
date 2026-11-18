import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatBytes, formatDuration, formatSpeed } from "../src/benchmark.js";

describe("formatBytes", () => {
  it("formats byte values", () => {
    assert.equal(formatBytes(0), "0 B");
    assert.equal(formatBytes(999), "999 B");
  });
  it("formats kilobytes with two decimals", () => {
    assert.equal(formatBytes(1_500), "1.50 KB");
  });
  it("formats megabytes", () => {
    assert.equal(formatBytes(2_000_000), "2.00 MB");
  });
  it("uses decimal units (1 KB = 1000 bytes)", () => {
    assert.equal(formatBytes(1_000), "1.00 KB");
  });
  it("handles negative and non-finite input", () => {
    assert.equal(formatBytes(-5), "0 B");
    assert.equal(formatBytes(Number.NaN), "0 B");
  });
});

describe("formatDuration", () => {
  it("formats sub-millisecond durations", () => {
    assert.equal(formatDuration(0.25), "0.25 ms");
  });
  it("formats milliseconds", () => {
    assert.equal(formatDuration(123), "123 ms");
  });
  it("formats seconds above one second", () => {
    assert.equal(formatDuration(2_500), "2.50 s");
  });
});

describe("formatSpeed", () => {
  it("appends /s to the byte formatting", () => {
    assert.equal(formatSpeed(1_500), "1.50 KB/s");
  });
});
