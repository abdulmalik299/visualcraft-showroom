const WORKER_API_BASE = "https://visualcraft-assets-api.abdulmelikdilshad.workers.dev";
const R2_PUBLIC_BASE = "https://pub-d7314f34e7644251a2d185d6b6bac405.r2.dev";

export type R2Object = {
  key: string;
  url: string;
  name: string;
  ext: string;
  baseName: string;
};

function normalizeKey(key: string) {
  return key.replace(/^\/+/, "");
}

function toR2Object(key: string): R2Object {
  const normalized = normalizeKey(key);
  const fileName = normalized.split("/").pop() ?? normalized;
  const dotIndex = fileName.lastIndexOf(".");
  const ext = dotIndex > -1 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
  const name = dotIndex > -1 ? fileName.slice(0, dotIndex) : fileName;
  const encodedKey = normalized
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return {
    key: normalized,
    url: `${R2_PUBLIC_BASE}/${encodedKey}`,
    name,
    ext,
    baseName: normalizeMediaBaseName(name)
  };
}

function normalizeMediaBaseName(name: string) {
  return name.replace(/[._-](\d{3,4})p$/i, "").trim().toLowerCase();
}

function parseKeysFromUnknown(payload: unknown): string[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const candidate = (item as { key?: unknown; name?: unknown; path?: unknown }).key
            ?? (item as { name?: unknown }).name
            ?? (item as { path?: unknown }).path;
          return typeof candidate === "string" ? candidate : null;
        }
        return null;
      })
      .filter((value): value is string => !!value);
  }

  if (typeof payload === "object") {
    const data = payload as {
      objects?: unknown;
      keys?: unknown;
      files?: unknown;
      result?: unknown;
      data?: unknown;
      items?: unknown;
    };

    return parseKeysFromUnknown(data.objects)
      .concat(parseKeysFromUnknown(data.keys))
      .concat(parseKeysFromUnknown(data.files))
      .concat(parseKeysFromUnknown(data.result))
      .concat(parseKeysFromUnknown(data.data))
      .concat(parseKeysFromUnknown(data.items));
  }

  return [];
}

async function fetchWithVariants(prefix: string) {
  const encodedPrefix = encodeURIComponent(prefix);
  const variants = [
    `${WORKER_API_BASE}/?prefix=${encodedPrefix}`,
    `${WORKER_API_BASE}/list?prefix=${encodedPrefix}`,
    `${WORKER_API_BASE}/assets?prefix=${encodedPrefix}`
  ];

  for (const url of variants) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) continue;
      const data = await res.json();
      const keys = parseKeysFromUnknown(data)
        .map(normalizeKey)
        .filter((key) => key.startsWith(prefix));
      if (keys.length > 0) return keys;
    } catch {
      // try next variant
    }
  }

  return [];
}

async function fetchWithPublicList(prefix: string) {
  const url = `${R2_PUBLIC_BASE}/?list-type=2&prefix=${encodeURIComponent(prefix)}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.querySelectorAll("Contents > Key"))
    .map((node) => node.textContent ?? "")
    .map(normalizeKey)
    .filter((key) => key.startsWith(prefix));
}

export async function listR2Objects(prefix: string, extensions: string[]) {
  const allowed = new Set(extensions.map((ext) => ext.toLowerCase()));
  const fromWorker = await fetchWithVariants(prefix);
  const keys = fromWorker.length > 0 ? fromWorker : await fetchWithPublicList(prefix);

  return keys
    .map(toR2Object)
    .filter((obj) => allowed.has(obj.ext))
    .sort((a, b) => b.name.localeCompare(a.name));
}

export function extractQualityLabel(name: string) {
  const match = name.match(/(?:[._-])(\d{3,4})p$/i);
  if (!match) return null;
  return `${match[1]}p`;
}
