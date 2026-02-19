import { SeedAuthorityPackProvider } from "@/providers/SeedAuthorityPackProvider";
import { HttpAuthorityPackProvider } from "@/providers/HttpAuthorityPackProvider";
import type { AuthorityPackProvider } from "@/providers/AuthorityPackProvider";

const PROVIDER = process.env.EXPO_PUBLIC_AUTHORITY_PACK_PROVIDER || "seed";

let provider: AuthorityPackProvider;

if (PROVIDER === "http") {
  provider = new HttpAuthorityPackProvider();
} else {
  provider = new SeedAuthorityPackProvider();
}

export const authorityPackProvider: AuthorityPackProvider = provider;
