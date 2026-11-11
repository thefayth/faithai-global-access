import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createApiState, handleApiRequest } from "./api-core.js";
import { createPostgresPool, createPostgresStore } from "./postgres-store.js";
import { createProviderRuntime } from "./provider-runtime.js";

export let state = createApiState();

function log(event, details = {}) { console.log(JSON.stringify({ event, at: new Date().toISOString(), ...details })); }

export async function initializeApiState(env = process.env) {
  const pool = createPostgresPool(env);
  if (!pool && String(env.FAITHAI_REQUIRE_DATABASE || "false").toLowerCase() === "true") throw new Error("DATABASE_URL is required when FAITHAI_REQUIRE_DATABASE=true");
  const store = createPostgresStore(pool);
  const runtime = createProviderRuntime(env);
  const next = createApiState({ env, store, ...runtime, databaseRequired: String(env.FAITHAI_REQUIRE_DATABASE || "false").toLowerCase() === "true" });
  if (store) {
    await store.health();
    await store.syncProviderStatus(next.config.providers, next.config.liveTerritories);
  }
  state = next;
  return next;
}

export function createFaithaiApiServer({ apiState = state, logger = log } = {}) {
  return createServer(async (request, serverResponse) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    try {
      const url = new URL(request.url || "/", "http://localhost");
      const chunks = [];
      for await (const chunk of request) {
        chunks.push(chunk);
        if (chunks.reduce((size, item) => size + item.length, 0) > 65536) throw new Error("request-too-large");
      }
      const raw = Buffer.concat(chunks).toString("utf8");
      const body = raw ? JSON.parse(raw) : {};
      const headers = Object.fromEntries(Object.entries(request.headers).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
      const result = await handleApiRequest(apiState, { method: request.method, path: url.pathname, query: Object.fromEntries(url.searchParams), headers, body, rawBody: raw });
      serverResponse.writeHead(result.status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "x-request-id": requestId });
      serverResponse.end(JSON.stringify(result.body));
      logger("faithai.api.request", { requestId, method: request.method, path: url.pathname, status: result.status, durationMs: Date.now() - startedAt });
    } catch (error) {
      const status = error?.message === "request-too-large" ? 413 : error instanceof SyntaxError ? 400 : 503;
      serverResponse.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "x-request-id": requestId });
      serverResponse.end(JSON.stringify({ error: status === 503 ? "service-unavailable" : "invalid-request" }));
      logger("faithai.api.error", { requestId, method: request.method, status, durationMs: Date.now() - startedAt, errorType: error?.name || "Error" });
    }
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.FAITHAI_API_PORT || 8788);
  await initializeApiState(process.env);
  const server = createFaithaiApiServer({ apiState: state });
  server.listen(port, "127.0.0.1", () => log("faithai.api.ready", { address: `http://127.0.0.1:${port}`, database: state.store ? "postgresql" : "memory" }));
  const shutdown = () => server.close(async () => { if (state.store?.close) await state.store.close(); process.exit(0); });
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
