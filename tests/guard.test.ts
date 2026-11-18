import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InvalidUrlError } from "../src/errors.js";
import { parseUrl } from "../src/guard.js";

describe("parseUrl", () => {
  it("accepts http and https URLs", () => {
    assert.equal(parseUrl("https://picsum.photos/1200/800").href, "https://picsum.photos/1200/800");
    assert.equal(parseUrl("http://127.0.0.1:8971/img").href, "http://127.0.0.1:8971/img");
  });
  it("rejects strings that are not URLs at all", () => {
    assert.throws(() => parseUrl("not-a-url"), InvalidUrlError);
    assert.throws(() => parseUrl(""), InvalidUrlError);
  });
  it("rejects non-http(s) protocols", () => {
    assert.throws(() => parseUrl("file:///etc/hosts"), InvalidUrlError);
    assert.throws(() => parseUrl("ftp://example.com/file"), InvalidUrlError);
    assert.throws(() => parseUrl("data:text/plain,hi"), InvalidUrlError);
  });
});
