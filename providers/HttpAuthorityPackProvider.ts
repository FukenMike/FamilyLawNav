
import type { AuthorityPackProvider } from "@/providers/AuthorityPackProvider";
import type { StatePack } from "@/services/packStore";
import { getPack, getManifest } from "@/services/packStore";
import { normalizePack } from "@/services/normalizePack";

export class HttpAuthorityPackProvider implements AuthorityPackProvider {
  async getStatePack(state: string): Promise<StatePack | null> {
    const res = await getPack(state);
    return res.pack ? normalizePack(res.pack) : null;
  }

  async getManifest() {
    const res = await getManifest();
    return res.manifest;
  }

  // non-interface helper (optional) to inspect last status
  async getPackStatus(state: string) {
    const res = await getPack(state);
    return res.status;
  }
}
