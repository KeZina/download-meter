import { InvalidUrlError } from "./errors.js";

export function parseUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new InvalidUrlError(raw, "it is not a valid absolute URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidUrlError(
      raw,
      `unsupported protocol "${url.protocol}". Only http: and https: are allowed.`,
    );
  }
  return url;
}
