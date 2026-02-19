import type { StatePack } from "@/data/statePacks/ga";

export interface AuthorityPackProvider {
  getStatePack(state: string): Promise<StatePack | null>;
}
