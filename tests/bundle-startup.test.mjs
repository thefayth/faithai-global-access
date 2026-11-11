import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

test('minified browser guide starts with a generated anonymous session', async () => {
  const result = await build({ entryPoints: [new URL('../src/remote-guide.js', import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1')], bundle: true, write: false, format: 'esm', platform: 'browser', target: ['chrome87', 'safari14'], minify: true });
  const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
  const client = module.createRemoteGuideClient();
  assert.equal(typeof client.checkAvailability, 'function');
  assert.equal(typeof client.interpretApproved, 'function');
  assert.doesNotThrow(() => client.cancel());
});
