import { useCallback, useEffect, useMemo, useState } from "react";
import { listR2Objects, type R2Object } from "../lib/r2";

type CacheEntry = {
  data: R2Object[];
  updatedAt: number;
  promise?: Promise<R2Object[]>;
  error?: string;
};

type Options = {
  pollMs?: number;
  staleMs?: number;
};

const listingCache = new Map<string, CacheEntry>();

function cacheKey(prefix: string, extensions: string[]) {
  return `${prefix}|${extensions.map((ext) => ext.toLowerCase()).sort().join(",")}`;
}

async function loadIntoCache(key: string, prefix: string, extensions: string[]) {
  const cached = listingCache.get(key);
  if (cached?.promise) return cached.promise;

  const promise = listR2Objects(prefix, extensions)
    .then((data) => {
      listingCache.set(key, { data, updatedAt: Date.now(), error: undefined });
      return data;
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Unable to load media.";
      listingCache.set(key, { data: cached?.data ?? [], updatedAt: cached?.updatedAt ?? 0, error: message });
      throw error;
    });

  listingCache.set(key, {
    data: cached?.data ?? [],
    updatedAt: cached?.updatedAt ?? 0,
    promise,
    error: cached?.error
  });

  try {
    return await promise;
  } finally {
    const latest = listingCache.get(key);
    if (latest?.promise) {
      listingCache.set(key, {
        data: latest.data,
        updatedAt: latest.updatedAt,
        error: latest.error
      });
    }
  }
}

export function useR2Listing(prefix: string, extensions: string[], options?: Options) {
  const pollMs = options?.pollMs ?? 60_000;
  const staleMs = options?.staleMs ?? 20_000;
  const extKey = useMemo(() => extensions.join(","), [extensions]);
  const key = useMemo(() => cacheKey(prefix, extKey.split(",")), [prefix, extKey]);

  const [items, setItems] = useState<R2Object[]>(() => listingCache.get(key)?.data ?? []);
  const [loading, setLoading] = useState(() => (listingCache.get(key)?.data?.length ?? 0) === 0);
  const [error, setError] = useState<string | null>(() => listingCache.get(key)?.error ?? null);

  const revalidate = useCallback(async () => {
    try {
      const next = await loadIntoCache(key, prefix, extKey.split(","));
      setItems(next);
      setError(null);
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load media.");
      return listingCache.get(key)?.data ?? [];
    }
  }, [key, prefix, extKey]);

  useEffect(() => {
    const cached = listingCache.get(key);
    if (cached?.data?.length) {
      setItems(cached.data);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(cached?.error ?? null);

    const freshEnough = cached && Date.now() - cached.updatedAt < staleMs;
    if (!freshEnough) revalidate().finally(() => setLoading(false));

    const interval = window.setInterval(() => {
      revalidate().catch(() => undefined);
    }, pollMs);

    return () => window.clearInterval(interval);
  }, [key, pollMs, revalidate, staleMs]);

  return { items, loading, error, revalidate };
}
