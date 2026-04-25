"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthErrorCode, validateAuthForm } from "@/lib/auth/forms";
import { getAppUrl, hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

async function getRequestOrigin() {
  const configuredAppUrl = getAppUrl();

  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) {
    return "http://127.0.0.1:3000";
  }

  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

export async function signInAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/login?error=auth-unavailable");
  }

  const parsed = validateAuthForm(formData, "login");

  if (!parsed.ok) {
    redirect(`/login?error=${encodeURIComponent(parsed.message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.values.email,
    password: parsed.values.password
  });

  if (error) {
    redirect(`/login?error=${getAuthErrorCode(error.message)}`);
  }

  redirect("/dashboard?message=welcome-back");
}

export async function signUpAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/signup?error=auth-unavailable");
  }

  const parsed = validateAuthForm(formData, "signup");

  if (!parsed.ok) {
    redirect(`/signup?error=${encodeURIComponent(parsed.message)}`);
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { error, data } = await supabase.auth.signUp({
    email: parsed.values.email,
    password: parsed.values.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: {
        display_name: parsed.values.displayName
      }
    }
  });

  if (error) {
    redirect(`/signup?error=${getAuthErrorCode(error.message)}`);
  }

  if (data.session) {
    redirect("/dashboard?message=welcome-back");
  }

  redirect("/login?message=account-created");
}

export async function signOutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect("/login?message=signed-out");
}
