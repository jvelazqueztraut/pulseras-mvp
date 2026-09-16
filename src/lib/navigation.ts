export function deviceDetailsHref(id: string): string {
  return `/devices/?id=${encodeURIComponent(id)}`;
}
