import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  HttpStatusError,
  NetworkError,
  RequestTimeoutError,
  ResponseTooLargeError,
} from "../src/errors.js";
import { knock } from "../src/knocker.js";
import { PAYLOAD, startDeadServer, startTestServer } from "./helpers.js";

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

function knockPath(
  path: string,
  overrides?: {
    timeoutMs?: number;
    maxBytes?: number;
  },
) {
  return knock({
    url: new URL(base + path),
    timeoutMs: overrides?.timeoutMs ?? 2_000,
    maxBytes: overrides?.maxBytes ?? 1_000_000,
  });
}

describe("knock", () => {
  it("resolves with the status, downloaded bytes and duration", async () => {
    const result = await knockPath("/img");
    assert.equal(result.status, 200);
    assert.equal(result.bytes, PAYLOAD.length);
    assert.ok(result.durationMs >= 0);
  });
  it("rejects non-2xx responses with HttpStatusError", async () => {
    await assert.rejects(knockPath("/missing"), HttpStatusError);
  });
  it("aborts responses exceeding maxBytes with ResponseTooLargeError", async () => {
    await assert.rejects(knockPath("/img", { maxBytes: 1_000 }), ResponseTooLargeError);
  });
  it("fails with RequestTimeoutError when the response stalls", async () => {
    await assert.rejects(knockPath("/slow", { timeoutMs: 200 }), RequestTimeoutError);
  });
  it("wraps connection failures in NetworkError", async () => {
    const deadBase = await startDeadServer();
    await assert.rejects(
      knock({
        url: new URL(deadBase + "/img"),
        timeoutMs: 2_000,
        maxBytes: 1_000_000,
      }),
      NetworkError,
    );
  });
});
