export type LegalCategory = {
  id: string;
  name: string;
  description?: string;
};

export type State = {
  id: string;
  name: string;
  abbreviation: string;
};

export type County = {
  id: string;
  name: string;
  state_id: string;
};

export type LegalResult = {
  id?: string;
  title: string;
  summary: string;
  source_url: string;
  state_id: string;
  category_id: string;
  county_id?: string;
  full_text: string;
  created_at?: string;
  updated_at?: string;
};

export type SearchQuery = {
  query: string;
  state_id?: string;
  category_id?: string;
  county_id?: string;
};

export type ClassifiedQuery = {
  original_query: string;
  state_id: string;
  category_id: string;
  county_id?: string;
  refined_query: string;
};

export type SearchState = {
  isSearching: boolean;
  query: string;
  results: LegalResult[];
  error: string | null;
  setQuery: (query: string) => void;
  setResults: (results: LegalResult[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setError: (error: string | null) => void;
  clearResults: () => void;
};// TODO: Implement this file
