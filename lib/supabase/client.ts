import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/env";

export type SupabaseBrowserClient = {
  anonKey: string;
  isConfigured: boolean;
  url: string;
};

export function createSupabaseBrowserClient(): SupabaseBrowserClient {
  const { url, anonKey } = getSupabaseEnv();

  return {
    url,
    anonKey,
    isConfigured: hasSupabaseEnv()
  };
}
