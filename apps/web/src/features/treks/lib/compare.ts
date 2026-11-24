export const MAX_COMPARED_TREKS = 3;
export const MIN_COMPARED_TREKS = 2;

export function compareHref(slugs: string[]): string {
  return `/treks/compare?treks=${slugs.map(encodeURIComponent).join(",")}`;
}

export function parseCompareSlugs(param: string | undefined, knownSlugs: string[]): string[] {
  if (!param) return [];

  const requested = param.split(",").map((slug) => slug.trim());
  const unique = [...new Set(requested)];

  return unique.filter((slug) => knownSlugs.includes(slug)).slice(0, MAX_COMPARED_TREKS);
}
