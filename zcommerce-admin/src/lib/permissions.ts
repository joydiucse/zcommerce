/** Check a permission key against a list that may contain "*" or "<resource>.*" wildcards. */
export function hasPermission(perms: readonly string[] | undefined, key?: string | string[]): boolean {
  if (!key || (Array.isArray(key) && key.length === 0)) return true;
  if (!perms) return false;
  const keys = Array.isArray(key) ? key : [key];
  return keys.some((k) => {
    if (perms.includes("*") || perms.includes(k)) return true;
    const resource = k.split(".")[0];
    return perms.includes(`${resource}.*`);
  });
}
