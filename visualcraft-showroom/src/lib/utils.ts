export function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function moneyUSD(value?: number) {
  if (value == null) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export function safeTags(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}
