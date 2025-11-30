export function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: undefined,
    }).format(new Date(value));
  } catch {
    return value;
  }
}
