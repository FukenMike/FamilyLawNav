export function encodeAuthorityId(citation: string): string {
  return encodeURIComponent(citation);
}

export function decodeAuthorityId(id: string): string {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}
