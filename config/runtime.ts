
import { SeedAuthorityPackProvider } from "@/providers/SeedAuthorityPackProvider";
import { HttpAuthorityPackProvider } from "@/providers/HttpAuthorityPackProvider";
import type { AuthorityPackProvider } from "@/providers/AuthorityPackProvider";

class CompositeAuthorityPackProvider implements AuthorityPackProvider {
  private http = new HttpAuthorityPackProvider();
  private seed = new SeedAuthorityPackProvider();

  async getStatePack(state: string) {
    const pack = await this.http.getStatePack(state);
    if (pack) return pack;
    return this.seed.getStatePack(state);
  }
  async getManifest() {
    if (typeof this.http.getManifest === 'function') {
      return this.http.getManifest();
    }
    return null;
  }
}

let provider: AuthorityPackProvider = new CompositeAuthorityPackProvider();

export function getAuthorityPackProvider(): AuthorityPackProvider {
  return provider;
}
