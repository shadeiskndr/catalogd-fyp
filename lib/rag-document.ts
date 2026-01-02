export type GameDocumentFields = {
  name: string;
  released: string;
  genres: readonly string[];
  platforms: readonly string[];
  tags: readonly string[];
  developers: readonly string[];
  publishers: readonly string[];
  description: string;
};

const MAX_TAGS = 24;

function line(label: string, values: readonly string[], cap?: number): string | null {
  const cleaned: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      cleaned.push(trimmed);
    }
  }
  const shown = cap === undefined ? cleaned : cleaned.slice(0, cap);
  return shown.length === 0 ? null : `${label}: ${shown.join(", ")}`;
}

export function releaseYear(released: string): string | null {
  const match = /^(\d{4})/.exec(released.trim());
  return match?.[1] ?? null;
}

export function buildGameDocument(fields: GameDocumentFields): string {
  const year = releaseYear(fields.released);
  const parts: Array<string | null> = [
    fields.name.trim(),
    year === null ? null : `Released ${year}`,
    line("Genres", fields.genres),
    line("Platforms", fields.platforms),
    line("Tags", fields.tags, MAX_TAGS),
    line("Developer", fields.developers),
    line("Publisher", fields.publishers),
    fields.description.trim().length === 0 ? null : fields.description.trim(),
  ];
  return parts.filter((part): part is string => part !== null && part.length > 0).join("\n");
}

export function hashDocument(document: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let index = 0; index < document.length; index += 1) {
    const code = document.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x811c9dc5) + (h2 << 5);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}

export function splitCommaList(value: string | null | undefined): string[] {
  if (typeof value !== "string") {
    return [];
  }
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
