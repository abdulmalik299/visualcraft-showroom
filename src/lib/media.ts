import type { R2Object } from "./r2";

export function humanizeName(name: string) {
  const normalized = name
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "Untitled";
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function inferTags(name: string) {
  return name
    .split(/[_-]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 1 && !/^\d{2,4}p$/.test(part))
    .slice(0, 5);
}

export function inferCategory(tags: string[]) {
  if (tags.some((tag) => ["logo", "brand", "identity"].includes(tag))) return "Logos";
  if (tags.some((tag) => ["product", "packshot", "ecom", "commerce"].includes(tag))) return "Product";
  if (tags.some((tag) => ["motion", "still", "frame", "cinematic"].includes(tag))) return "Motion Stills";
  if (tags.some((tag) => ["ui", "ux", "dashboard", "app", "web"].includes(tag))) return "UI";
  if (tags.some((tag) => ["portrait", "editorial", "fashion"].includes(tag))) return "Portrait";
  return "Other";
}

export function sortByFreshness(items: R2Object[]) {
  return [...items].sort((a, b) => {
    const at = a.lastModified ? Date.parse(a.lastModified) : Number.NaN;
    const bt = b.lastModified ? Date.parse(b.lastModified) : Number.NaN;
    if (!Number.isNaN(at) && !Number.isNaN(bt) && at !== bt) return bt - at;
    return b.name.localeCompare(a.name);
  });
}
