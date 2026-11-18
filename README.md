# download-meter

English | [Русский](README.ru.md)

A tiny Node.js (TypeScript) console tool that "knocks" on a URL — sends
consecutive requests and waits for every response to fully download — and then
reports the measured download speed.

Suggested target: **https://picsum.photos/1200/800** — a free image API
(no key, no registration) that returns a random photo per request, which is
perfect for repeat speed measurements.

## Requirements

- Node.js >= 18.17 (built-in `fetch` is used, no HTTP client dependency)
- npm

## Install

```bash
npm install
```

## Launch

Run directly from TypeScript sources with `tsx` — with no arguments it
knocks on the default target (`https://picsum.photos/1200/800`):

```bash
npm run knock
```

Or pass any custom URL:

```bash
npm run knock -- https://picsum.photos/1200/800
```

Or build and run the compiled JavaScript:

```bash
npm run build
node dist/main.js            # default target
node dist/main.js https://picsum.photos/1200/800
```

### Options

| Option               | Default                          | Description                                         |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| `[url]`              | `https://picsum.photos/1200/800` | Target to knock on, `http` or `https` only          |
| `-c, --count <n>`    | `10`                             | Number of consecutive requests                      |
| `-t, --timeout <ms>` | `15000`                          | Timeout per request in milliseconds                 |
| `--max-size <bytes>` | `100000000`                      | Abort a single response larger than this many bytes |
| `-h, --help`         | —                                | Show help                                           |

### Example session

```text
STARTUP 2025-01-01 12:00:00:00 >> download-meter is warming up...
INFO    2025-01-01 12:00:00:01 >> Knocking on https://picsum.photos/1200/800 10 times, one knock at a time...
SUCCESS 2025-01-01 12:00:01:12 >> Knock 01/10: HTTP 200, 98.34 KB in 1.11 s
...
RESULTS 2025-01-01 12:00:11:40 >> All knocks completed:
INFO    2025-01-01 12:00:11:41 >>   Total downloaded : 983.40 KB across 10 requests
INFO    2025-01-01 12:00:11:41 >>   Average request time: 1.11 s
SPEED   2025-01-01 12:00:11:41 >> Average download speed: 886.36 KB/s (884.12 KB/s including per-request overhead)
```

## Measurement & units

The tool performs the requests **strictly one after another**, each time
waiting for the response body to finish downloading.

- **Average request time** — the arithmetic mean of the per-request durations,
  measured from the start of the request until the last byte of the body has
  arrived. Expressed in milliseconds, or seconds once above 1 s.
- **Total downloaded data** — the actual number of bytes read from the
  response bodies (chunk-by-chunk, not merely the `Content-Length` header),
  summed across all successful requests.
- **Download speed** — `total downloaded bytes / total download time`.
  Additionally the "wall" speed including per-request overhead (connection
  setup, TLS handshake, latency) is shown.

### Units

Decimal (SI) byte units are used everywhere, in both the summary and the
README:

- `1 KB = 1 000 bytes`
- `1 MB = 1 000 KB`
- `1 GB = 1 000 MB`

Speed is therefore reported in `B/s`, `KB/s`, `MB/s`, etc., with
`1 KB/s = 1 000 bytes per second`. This matches how network links (and most
browser download readouts) are rated.

## Error handling

The tool fails fast with a pretty `silly-logger` message and exit code `1`
when:

- the argument is not a valid absolute URL;
- the URL does not use `http:` / `https:` (e.g. `file://`, `ftp://` — rejected);
- the server answers with a **non-2xx status** (e.g. 404, 500);
- a response **exceeds `--max-size`** while streaming (guards against huge or
  decompression-bomb style payloads);
- a request **times out** (`--timeout`);
- a network-level error occurs (DNS failure, connection refused, reset, ...).

## Testing

Tests use Node's built-in test runner (`node:test`) — no extra framework —
and run against a local loopback HTTP server:

```bash
npm test
```

They cover the unit formatting helpers, URL validation (`parseUrl`), a single
`knock` (success, non-2xx, oversized response, stalled response, connection
failure), and the `meterUrl` aggregation over multiple knocks.

## Development

Code style is enforced by Prettier (`.prettierrc`, default style) while
ESLint (`typescript-eslint` + `eslint-config-prettier`) checks code quality
only, so the two tools never fight over formatting.

```bash
npm run format:check  # verify Prettier style
npm run format        # reformat everything with Prettier
npm run lint          # ESLint code-quality check
npm run lint:fix      # auto-fix ESLint problems
npm run typecheck     # strict TypeScript check
npm test              # run the test suite
npm run build         # compile to dist/
npm run knock -- <url>
```
