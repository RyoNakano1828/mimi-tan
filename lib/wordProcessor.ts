export function parseWords(input: string): string[] {
  const raw = input
    .split(/[\n,、，;；\t]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const word of raw) {
    const normalized = word.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      );
    }
  }

  return unique;
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
