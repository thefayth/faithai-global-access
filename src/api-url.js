/** API base is a mount prefix; the version belongs to the endpoint once. */
export function apiUrl(endpoint, mount = "") {
  const base = String(mount).replace(/\/+$/, "").replace(/\/v1$/, "");
  const route = String(endpoint).replace(/^\/+/, "").replace(/^v1\//, "");
  return `${base}/v1/${route}`;
}
