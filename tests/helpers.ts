import http from "node:http";
import type { AddressInfo } from "node:net";

export const PAYLOAD = Buffer.alloc(500_000, 0x61);

export interface TestServer {
  base: string;
  close(): Promise<void>;
}

export async function startTestServer(): Promise<TestServer> {
  const server = http.createServer((req, res) => {
    const path = req.url ?? "/";

    if (path === "/img") {
      res.writeHead(200, { "content-type": "application/octet-stream" });
      res.end(PAYLOAD);
    } else if (path === "/missing") {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    } else if (path === "/slow") {
      setTimeout(() => {
        res.writeHead(200);
        res.end("slow");
      }, 500);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const { port } = server.address() as AddressInfo;

  return {
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

export async function startDeadServer(): Promise<string> {
  const server = http.createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const { port } = server.address() as AddressInfo;

  await new Promise<void>((resolve) => server.close(() => resolve()));

  return `http://127.0.0.1:${port}`;
}
