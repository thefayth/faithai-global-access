#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(path.join(root, "wrangler.jsonc"), "utf8"));
const vars = config.vars || {};
const requiredFalse = ["FAITHAI_AI_ENABLED", "FAITHAI_ADSENSE_ENABLED", "FAITHAI_EXOCLICK_ENABLED", "FAITHAI_STRIPE_ENABLED", "FAITHAI_PAYSTACK_ENABLED", "FAITHAI_FLUTTERWAVE_ENABLED", "FAITHAI_CONTENT_SYNC_ENABLED"];
const errors = [];
if (config.main !== "./cloudflare/worker.js") errors.push("worker entry must be cloudflare/worker.js");
if (config.assets?.binding !== "ASSETS" || config.assets?.run_worker_first?.[0] !== "/v1/*") errors.push("static asset/API routing is not configured");
if (config.d1_databases?.[0]?.database_id === "REPLACE_WITH_D1_DATABASE_ID") errors.push("D1 database id is still a deployment placeholder");
for (const key of requiredFalse) if (String(vars[key]).toLowerCase() === "true") errors.push(`${key} must remain false before pilot review`);
if (errors.length) {
  console.error("Public deployment config is prepared but not deployable:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log("Public deployment config is structurally valid and external providers remain disabled.");
}
