const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function parseIsoDate(value: string): { year: string; month: string; day: string } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match === null) {
    return null;
  }
  const [, year, month, day] = match;
  if (year === undefined || month === undefined || day === undefined) {
    return null;
  }
  return { year, month, day };
}

function monthLabel(month: string): string | undefined {
  return MONTHS[Number.parseInt(month, 10) - 1];
}

export function formatReleaseDate(released: string | null | undefined): string {
  if (!released) {
    return "TBA";
  }
  const parts = parseIsoDate(released);
  if (parts === null) {
    return released;
  }
  const label = monthLabel(parts.month);
  if (label === undefined) {
    return parts.year;
  }
  return `${label} ${Number.parseInt(parts.day, 10)}, ${parts.year}`;
}

export function formatReleaseYear(released: string | null | undefined): string {
  if (!released) {
    return "TBA";
  }
  return parseIsoDate(released)?.year ?? released;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const label = MONTHS[date.getUTCMonth()];
  if (label === undefined) {
    return "";
  }
  return `${label} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(value);
}
