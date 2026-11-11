import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const [directory, commit, variant] = process.argv.slice(2);
if (!directory || !/^[a-f0-9]{40}$/.test(commit || '') || !['general', 'binet-help', 'legacy'].includes(variant)) throw new Error('Provide artifact directory, exact source commit, and variant.');
async function files(folder, prefix = '') {
  const result = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await files(path.join(folder, entry.name), relative));
    else if (relative !== 'release.json') result.push({ path: relative, sha256: createHash('sha256').update(await readFile(path.join(folder, entry.name))).digest('hex') });
  }
  return result.sort((a, b) => a.path.localeCompare(b.path));
}
const artifacts = await files(directory);
const manifest = {
  version: '20261110Tlaunch', sourceRepository: 'https://github.com/thefayth/faithai-global-access', sourceCommit: commit, variant,
  publishedDate: '2026-11-10', buildChecksum: createHash('sha256').update(JSON.stringify(artifacts)).digest('hex'),
  capabilities: { localGuide: 'available', localJourney: 'available', offlineGames: 'available-English', ai: 'selected-alibaba-disabled-no-regular-api-access', ads: 'disabled-awaiting-property-review', payments: 'not-connected-live', smsUssd: 'simulated', emergency: 'guidance-only-no-live-directory', publicWrites: 'disabled-awaiting-reviewed-workflows' },
  content: { bundled: 'prototype-pending-human-review-and-signing', productionPacks: [] }, artifacts,
};
await writeFile(path.join(directory, 'release.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ variant, sourceCommit: commit, buildChecksum: manifest.buildChecksum }));
