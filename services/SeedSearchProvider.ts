import { SearchProvider, SearchResult } from "@/types/search";

const seedData: SearchResult[] = [
  {
    id: "1",
    title: "Child Custody Basics",
    summary: "Overview of custody types and court considerations.",
  },
  {
    id: "2",
    title: "Modifying a Custody Order",
    summary: "How to request a modification after a life change.",
  },
  {
    id: "3",
    title: "Filing for Divorce",
    summary: "Initial steps and documentation required.",
  },
];

export class SeedSearchProvider implements SearchProvider {
  async search(query: string): Promise<SearchResult[]> {
    const lower = query.toLowerCase();

    return seedData.filter(item =>
      item.title.toLowerCase().includes(lower) ||
      item.summary.toLowerCase().includes(lower)
    );
  }
}
