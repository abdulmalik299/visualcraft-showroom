const WORKER_API_BASE = "https://visualcraft-assets-api.abdulmelikdilshad.workers.dev";
const R2_PUBLIC_BASE = "https://pub-d7314f34e7644251a2d185d6b6bac405.r2.dev";

export type R2Object = {
  key: string;
  url: string;
  name: string;
  ext: string;
  baseName: string;
  lastModified?: string;
};

type ParsedListItem = {
  key: string;
  url?: string;
  lastModified?: string;
};

function normalizeKey(key: string) {
  const trimmed = key.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return url.pathname.replace(/^\/+/, "");
    } catch {
      return trimmed.replace(/^\/+/, "");
    }
  }
  return trimmed.replace(/^\/+/, "");
}

function normalizeMediaBaseName(name: string) {
  return name.replace(/[._-](\d{3,4})p$/i, "").trim().toLowerCase();
}

function deriveBaseName(normalizedKey: string, name: string, ext: string) {
  if (ext === "m3u8" && /^master$/i.test(name)) {
    const parent = normalizedKey.split("/").slice(-2, -1)[0];
    if (parent) return normalizeMediaBaseName(parent);
  }
  return normalizeMediaBaseName(name);
}

function hasFileExtension(key: string) {
  const fileName = key.split("/").pop() ?? key;
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 && dotIndex < fileName.length - 1;
}

function isRenderableObject(item: ParsedListItem) {
  const normalized = normalizeKey(item.key);
  if (!normalized || normalized.endsWith("/")) return false;
  return hasFileExtension(normalized);
}

function resolveObjectUrl(normalizedKey: string, explicitUrl?: string) {
  if (explicitUrl) return explicitUrl;
  const isAbsolute = /^https?:\/\//i.test(normalizedKey);
  if (isAbsolute) return normalizedKey;

  const encodedKey = normalizedKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${R2_PUBLIC_BASE}/${encodedKey}`;
}

function toR2Object(item: ParsedListItem): R2Object {
  const normalized = normalizeKey(item.key);
  const fileName = normalized.split("/").pop() ?? normalized;
  const dotIndex = fileName.lastIndexOf(".");
  const ext = dotIndex > -1 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
  const name = dotIndex > -1 ? fileName.slice(0, dotIndex) : fileName;

  return {
    key: normalized,
    url: resolveObjectUrl(normalized, item.url),
    name,
    ext,
    baseName: deriveBaseName(normalized, name, ext),
    lastModified: item.lastModified
  };
}

function asIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

function parseItemFromUnknown(item: unknown): ParsedListItem | null {
  if (typeof item === "string") return { key: item };
  if (!item || typeof item !== "object") return null;

  const row = item as {
    key?: unknown;
    name?: unknown;
    path?: unknown;
    Key?: unknown;
    url?: unknown;
    publicUrl?: unknown;
    href?: unknown;
    src?: unknown;
    lastModified?: unknown;
    last_modified?: unknown;
    uploaded?: unknown;
    updatedAt?: unknown;
  };

  const keyCandidate = row.key ?? row.name ?? row.path ?? row.Key;
  const urlCandidate = row.url ?? row.publicUrl ?? row.href ?? row.src;
  if (typeof keyCandidate !== "string") return null;

  return {
    key: keyCandidate,
    url: typeof urlCandidate === "string" ? urlCandidate : undefined,
    lastModified:
      asIsoDate(row.lastModified) ??
      asIsoDate(row.last_modified) ??
      asIsoDate(row.uploaded) ??
      asIsoDate(row.updatedAt)
  };
}

function parseItemsFromUnknown(payload: unknown): ParsedListItem[] {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload
      .map(parseItemFromUnknown)
      .filter((value): value is ParsedListItem => !!value);
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

    return parseItemsFromUnknown(data.objects)
      .concat(parseItemsFromUnknown(data.keys))
      .concat(parseItemsFromUnknown(data.files))
      .concat(parseItemsFromUnknown(data.result))
      .concat(parseItemsFromUnknown(data.data))
      .concat(parseItemsFromUnknown(data.items));
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
      const rows = parseItemsFromUnknown(data)
        .map((item) => ({ ...item, key: normalizeKey(item.key) }))
        .filter((item) => item.key.startsWith(prefix))
        .filter(isRenderableObject);
      if (rows.length > 0) return rows;
    } catch {
      // try next variant
    }
  }

  return [];
}

async function fetchWithPublicList(prefix: string) {
  const url = `${R2_PUBLIC_BASE}/?list-type=2&prefix=${encodeURIComponent(prefix)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Unable to list assets from storage.");

  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  return Array.from(doc.querySelectorAll("Contents"))
    .map((content) => {
      const key = content.querySelector("Key")?.textContent ?? "";
      const lastModified = asIsoDate(content.querySelector("LastModified")?.textContent ?? undefined);
      return { key, lastModified };
    })
    .map((item) => ({ ...item, key: normalizeKey(item.key) }))
    .filter((item) => item.key.startsWith(prefix))
    .filter(isRenderableObject);
}

function toTimestamp(value?: string) {
  if (!value) return Number.NaN;
  return Date.parse(value);
}

export async function listR2Objects(prefix: string, extensions: string[]) {
  const allowed = new Set(extensions.map((ext) => ext.toLowerCase()));

  try {
    const fromWorker = await fetchWithVariants(prefix);
    let rows = fromWorker;
    if (rows.length === 0) {
      try {
        rows = await fetchWithPublicList(prefix);
      } catch {
        rows = [];
      }
    }

    return rows
      .map(toR2Object)
      .filter((obj) => allowed.has(obj.ext))
      .sort((a, b) => {
        const at = toTimestamp(a.lastModified);
        const bt = toTimestamp(b.lastModified);
        if (!Number.isNaN(at) && !Number.isNaN(bt) && at !== bt) {
          return bt - at;
        }
        return b.name.localeCompare(a.name);
      });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unable to load assets right now.");
  }
}

export function extractQualityLabel(name: string) {
  const match = name.match(/(?:[._-])(\d{3,4})p$/i);
  if (!match) return null;
  return `${match[1]}p`;
}
