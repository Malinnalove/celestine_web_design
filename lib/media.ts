export function formatImageSrc(source: string, query = ""): string {
  if (!source) {
    return source;
  }

  if (source.startsWith("data:") || source.startsWith("blob:")) {
    return source;
  }

  if (!query) {
    return source;
  }

  if (source.includes("?")) {
    return source;
  }

  return `${source}${query}`;
}

