export type CoverageType = "national" | "state" | "zip_prefix";

export interface Resource {
  id: string;
  title: string;
  summary: string;
  url?: string | null;
  category?: string | null;
  last_verified_at?: string | null;
}

export interface SearchResponse {
  count: number;
  results: Resource[];
}
