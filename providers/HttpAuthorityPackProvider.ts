import type { StatePack } from "@/data/statePacks/ga";
import type { AuthorityPackProvider } from "@/providers/AuthorityPackProvider";

const ENDPOINT = process.env.EXPO_PUBLIC_AUTHORITY_PACK_ENDPOINT;

export class HttpAuthorityPackProvider implements AuthorityPackProvider {
  async getStatePack(state: string): Promise<StatePack | null> {
    if (!ENDPOINT) return null;
    try {
      const res = await fetch(`${ENDPOINT}/state/${state}`);
      if (!res.ok) return null;
      return (await res.json()) as StatePack;
    } catch {
      return null;
    }
  }
}
