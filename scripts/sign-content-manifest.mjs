import { readFile, rename, writeFile } from "node:fs/promises";
import { createPrivateKey, randomUUID, sign } from "node:crypto";
import { resolve } from "node:path";

const manifestPath = resolve(process.argv[2] || "public/packs/manifest.json");
const signaturePath = `${manifestPath}.sig`;
const privateJwkText = process.env.FAITHAI_PACK_SIGNING_KEY;

if (!privateJwkText) {
  console.error("FAITHAI_PACK_SIGNING_KEY is required. Load it from the secure vault; never commit the private JWK.");
  process.exitCode = 2;
} else {
  const manifest = await readFile(manifestPath);
  const privateKey = createPrivateKey({ key: JSON.parse(privateJwkText), format: "jwk" });
  const signature = sign(null, manifest, privateKey).toString("base64");
  const temporaryPath = `${signaturePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, `${signature}\n`, { flag: "wx" });
  await rename(temporaryPath, signaturePath);
  console.log(`Signed ${manifestPath}`);
  console.log(`Wrote ${signaturePath}`);
}
