export type SupabaseEnv = {
  publishableKey: string;
  url: string;
};

export function getSupabaseEnv(): SupabaseEnv {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      ""
  };
}

export function hasSupabaseEnv() {
  const { url, publishableKey } = getSupabaseEnv();

  return Boolean(url && publishableKey);
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}
