import { createProviderRuntime } from '../../server/provider-runtime.js';
import { createPostgresPool, createPostgresStore } from '../../server/postgres-store.js';
import { createApiState } from '../../server/api-core.js';
const pool = createPostgresPool(process.env);
const store = createPostgresStore(pool);
const runtime = createProviderRuntime(process.env, { fetcher: async (...args) => {
  const response = await fetch(...args);
  if (!response.ok) {
    const body = await response.clone().json().catch(() => ({}));
    console.log(JSON.stringify({ providerHttpStatus: response.status, errorType: body.error?.type, errorCode: body.error?.code, parameter: body.error?.param }));
  }
  return response;
} });
try {
  const state = createApiState({ env: process.env, store, ...runtime, databaseRequired: true });
  const result = await state.aiGateway.interpret({ approvedUtterance: 'I want a short creative exercise for learning.', consent: true, scene: 'listen', locale: 'en', territory: 'us', sessionKey: 'release-diagnostic-20261110', requestId: 'release-diagnostic-20261110' });
  console.log(JSON.stringify({ ok: result.ok, provenance: result.provenance, intent: result.intent || null, code: result.code || null }));
} finally { await store.close(); }
