import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LegalResult, SearchState } from "@/types";

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      isSearching: false,
      query: "",
      results: [],
      error: null,
      setQuery: (query: string) => set({ query }),
      setResults: (results: LegalResult[]) => set({ results }),
      setIsSearching: (isSearching: boolean) => set({ isSearching }),
      setError: (error: string | null) => set({ error }),
      clearResults: () => set({ results: [] }),
    }),
    {
      name: "search-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); TODO: Implement this file
