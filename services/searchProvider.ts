import { SearchResponse } from "@/types/resource";

const baseUrl =
  process.env.EXPO_PUBLIC_FAMILYLAW_API_BASE_URL?.trim() || "http://127.0.0.1:8787";

export async function searchResources(params: {
  q?: string;
  state?: string;
  zip?: string;
}): Promise<SearchResponse> {
  const url = new URL("/search", baseUrl);
  if (params.q) url.searchParams.set("q", params.q);
  if (params.state) url.searchParams.set("state", params.state);
  if (params.zip) url.searchParams.set("zip", params.zip);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Search failed (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as SearchResponse;
}
