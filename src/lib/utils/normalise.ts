export function normalizeTag(tag: string) {
  return tag
    .toLowerCase()
    .replace(/\s+/g, "-");
}
