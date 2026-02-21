import type { AuthorityPackProvider } from "@/providers/AuthorityPackProvider";
import { getStatePack } from "@/data/statePacks";
import { normalizePack } from "@/services/normalizePack";

export class SeedAuthorityPackProvider implements AuthorityPackProvider {
  async getStatePack(state: string): Promise<any | null> {
    if (!state) return null;
    const pack = getStatePack(state);
    return pack ? normalizePack(pack) : null;
  }
}
