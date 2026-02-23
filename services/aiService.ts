// simple AI summary stub; later this can call a remote API

export async function summarizeAuthority(authorityText: string): Promise<string> {
  // deterministic local fallback
  if (!authorityText) return '';
  if (authorityText.length <= 400) {
    // split into sentences and return first two
    const parts = authorityText.split(/(?<=[.!?])\s+/);
    if (parts.length <= 2) return authorityText;
    return parts.slice(0,2).join(' ');
  }
  return authorityText.slice(0,400) + '...';
}
