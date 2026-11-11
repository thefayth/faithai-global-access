import assert from 'node:assert/strict';
const origin = process.env.FAITHAI_VERIFY_ORIGIN || 'http://127.0.0.1:8792';
const health = await (await fetch(`${origin}/health`)).json();
assert.equal(health.ok, true);
const status = await (await fetch(`${origin}/v1/capabilities`)).json();
assert.equal(status.providers.ai, false);
assert.equal(status.providers.stripe, false);
assert.equal(status.providers.exoclick, false);
assert.equal(status.providers.adsense, false);
assert.equal(status.publicWritesEnabled, false);
assert.equal(status.aiBudget, 'durable-conservative-reservation');
for (const endpoint of ['sync/events', 'power-credits', 'circles/join', 'progress']) {
  const response = await fetch(`${origin}/v1/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'public-writes-disabled');
}
console.log(JSON.stringify({ health: true, externalProvidersOff: true, productionWriteGate: true, durableBudget: true, liveAi: false, smsUssd: status.sms }));
