export interface SearchResult {
  id: string;
  title: string;
  summary: string;
  url?: string;
}

export interface SearchProvider {
  search(query: string): Promise<SearchResult[]>;
}
