import { cookies } from "next/headers";

import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/env";

export type SupabaseServerClient = {
  anonKey: string;
  cookieStore: ReturnType<typeof cookies>;
  isConfigured: boolean;
  url: string;
};

export function createSupabaseServerClient(): SupabaseServerClient {
  const { url, anonKey } = getSupabaseEnv();

  return {
    url,
    anonKey,
    cookieStore: cookies(),
    isConfigured: hasSupabaseEnv()
  };
}
