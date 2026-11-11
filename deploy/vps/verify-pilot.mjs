import assert from 'node:assert/strict';
const origin = process.env.FAITHAI_VERIFY_ORIGIN || 'http://127.0.0.1:8792';
const headers = { 'content-type': 'application/json', 'x-faithai-session': 'release-synthetic-20261110' };
async function post(body) {
  const response = await fetch(`${origin}/v1/ai/interpret`, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
const health = await (await fetch(`${origin}/health`)).json();
assert.equal(health.ok, true);
const capabilities = await (await fetch(`${origin}/v1/capabilities`)).json();
assert.equal(capabilities.providers.ai, true);
assert.equal(capabilities.aiBudget, 'durable-conservative-reservation');
const input = { approvedUtterance: 'I want a short creative exercise for learning.', locale: 'en', territory: 'us', scene: 'listen', consent: true, requestId: 'release-synthetic-20261110' };
assert.equal((await post({ ...input, consent: false })).body.code, 'consent-required');
assert.notEqual((await post({ ...input, scene: 'safety' })).body.provenance, 'remote');
assert.notEqual((await post({ ...input, territory: 'xx' })).body.provenance, 'remote');
const live = await post(input);
console.log(JSON.stringify({ health: true, durableBudget: true, consentAndSafetyAndTerritoryGates: true, remoteStatus: live.status, remote: live.body.provenance === 'remote', intent: live.body.intent || null, fallbackCode: live.body.code || null }));
assert.equal(live.body.provenance, 'remote', 'Hosted reply unavailable; do not claim live AI verification.');
