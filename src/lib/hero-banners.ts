/** Até 3 fotos do banner principal (home); só entra na rotação se preenchidas. */
export function collectHeroBannerImages(
  urls: Array<string | null | undefined>,
  fallback: string,
): string[] {
  const unique = new Set<string>();
  for (const raw of urls) {
    const v = raw?.trim();
    if (v) unique.add(v);
  }
  const list = [...unique];
  return list.length > 0 ? list.slice(0, 3) : [fallback];
}