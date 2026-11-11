function toHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value) {
  const bytes = value instanceof Uint8Array ? value : new TextEncoder().encode(value);
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
}

export async function verifyPackChecksum(bytes, expected) {
  if (!expected || expected === "development-manifest-not-signed") return false;
  return (await sha256Hex(bytes)) === expected.toLowerCase();
}

export async function verifySignedManifest(manifestText, signatureBase64, publicKeyJwk) {
  if (!signatureBase64 || !publicKeyJwk) return false;
  try {
    const key = await crypto.subtle.importKey("jwk", publicKeyJwk, { name: "Ed25519" }, false, ["verify"]);
    const signature = Uint8Array.from(atob(signatureBase64), (character) => character.charCodeAt(0));
    return crypto.subtle.verify("Ed25519", key, signature, new TextEncoder().encode(manifestText));
  } catch { return false; }
}

export class MemoryChunkStore {
  constructor() { this.chunks = []; }
  async getLength() { return this.chunks.reduce((total, chunk) => total + chunk.byteLength, 0); }
  async append(chunk) { this.chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk)); }
  async readAll() {
    const length = await this.getLength();
    const joined = new Uint8Array(length);
    let offset = 0;
    this.chunks.forEach((chunk) => { joined.set(chunk, offset); offset += chunk.byteLength; });
    return joined;
  }
  async clear() { this.chunks = []; }
}

export async function downloadPackResumable(url, { store, fetcher = fetch, signal } = {}) {
  if (!store) throw new Error("A chunk store is required.");
  const offset = await store.getLength();
  const headers = offset ? { Range: `bytes=${offset}-` } : {};
  const response = await fetcher(url, { headers, signal });
  if (!response.ok && response.status !== 206) throw new Error(`Pack download failed: ${response.status}`);
  if (offset && response.status === 200) await store.clear();
  if (!response.body?.getReader) { await store.append(new Uint8Array(await response.arrayBuffer())); return store.readAll(); }
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    await store.append(value);
  }
  return store.readAll();
}
