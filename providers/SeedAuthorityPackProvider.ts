import type { AuthorityPackProvider } from "@/providers/AuthorityPackProvider";
import { getStatePack } from "@/data/statePacks";

export class SeedAuthorityPackProvider implements AuthorityPackProvider {
  async getStatePack(state: string): Promise<any | null> {
    if (!state) return null;
    return getStatePack(state);
  }
}
