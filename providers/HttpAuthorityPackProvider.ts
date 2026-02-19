
import type { StatePack } from "@/data/statePacks/ga";
import type { AuthorityPackProvider } from "@/providers/AuthorityPackProvider";
import { fetchPack, fetchManifest } from "@/services/packStore";

export class HttpAuthorityPackProvider implements AuthorityPackProvider {
  async getStatePack(state: string): Promise<StatePack | null> {
    return await fetchPack(state);
  }

  async getManifest() {
    return await fetchManifest();
  }
}
