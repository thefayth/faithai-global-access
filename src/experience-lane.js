/**
 * Public hosts enter their intended lane directly. Other hosts retain the
 * chooser so previews and the existing faithai.aixyz.tech deployment work.
 */
export function experienceForHostname(hostname = "") {
  const host = String(hostname).trim().toLowerCase().replace(/\.$/, "");
  if (host === "app.binetusa.org") return "binet";
  if (host === "ai.thefayth.net") return "general";
  return null;
}
