import { gaPack, StatePack } from "@/data/statePacks/ga";
import type { AuthorityPackProvider } from "@/providers/AuthorityPackProvider";

export class SeedAuthorityPackProvider implements AuthorityPackProvider {
  async getStatePack(state: string): Promise<StatePack | null> {
    if (state.toUpperCase() === "GA") return gaPack;
    return null;
  }
}
