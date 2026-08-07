import type { Plugin, ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

export function apiDevPlugin(): Plugin {
  return {
    name: "qb-api-dev",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const url = req.url ?? "";
          if (!url.startsWith("/api/")) return next();

          const route = url.split("?")[0].slice("/api/".length);

          const chunks: Buffer[] = [];
          await new Promise<void>((resolve, reject) => {
            req.on("data", (chunk: Buffer) => chunks.push(chunk));
            req.on("end", resolve);
            req.on("error", reject);
          });
          const raw = Buffer.concat(chunks).toString("utf-8");
          let body: unknown = raw;
          if (raw.length > 0) {
            try {
              body = JSON.parse(raw);
            } catch {
              // leave as raw string
            }
          }

          const vReq = {
            method: req.method,
            body,
            headers: req.headers as Record<string, string | string[] | undefined>,
          };

          let statusCode = 200;
          const pendingHeaders: Record<string, string> = {};
          const vRes = {
            status(code: number) {
              statusCode = code;
              return vRes;
            },
            setHeader(name: string, value: string) {
              pendingHeaders[name] = value;
            },
            json(data: unknown) {
              res.writeHead(statusCode, {
                "Content-Type": "application/json",
                ...pendingHeaders,
              });
              res.end(JSON.stringify(data));
            },
          };

          try {
            const mod = await server.ssrLoadModule(`/api/${route}.ts`);
            if (typeof mod.default === "function") {
              await mod.default(vReq, vRes);
            } else {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Not found" }));
            }
          } catch (err) {
            console.error("[qb-api-dev]", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        },
      );
    },
  };
}
