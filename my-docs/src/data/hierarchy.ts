import type { Division } from "./library";

export function divisionTrail(
  divisions: Division[],
  slug?: string,
): Division[] {
  const trail: Division[] = [];
  const visited = new Set<string>();
  let current = divisions.find((item) => item.slug === slug);
  while (current && !visited.has(current.slug)) {
    trail.unshift(current);
    visited.add(current.slug);
    current = divisions.find((item) => item.slug === current?.parent);
  }
  return trail;
}

export function withinDivision(
  divisions: Division[],
  slug: string,
  parent?: string,
) {
  return (
    !parent ||
    divisionTrail(divisions, slug).some((item) => item.slug === parent)
  );
}

export function normalizeSearch(value: string) {
  // Permit romaji without macrons (e.g. "Kozo") and full-width input.
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase();
}

export function divisionMatches(division: Division, query: string) {
  return normalizeSearch(
    [
      division.name,
      division.englishName,
      division.japanese,
      division.romaji,
      division.description,
    ].join(" "),
  ).includes(normalizeSearch(query));
}
