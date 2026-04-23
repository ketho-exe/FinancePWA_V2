import { readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = process.cwd();
const schemaSql = readFileSync(
  join(
    workspaceRoot,
    "supabase",
    "migrations",
    "202604230001_initial_schema.sql"
  ),
  "utf8"
);

describe("Supabase schema migrations", () => {
  it("uses ownership-aware foreign keys for user-owned relationships", () => {
    expect(schemaSql).toMatch(
      /create table public\.transactions[\s\S]*foreign key \(user_id, account_id\)[\s\S]*references public\.accounts \(user_id, id\)/i
    );
    expect(schemaSql).toMatch(
      /create table public\.transactions[\s\S]*foreign key \(user_id, category_id\)[\s\S]*references public\.categories \(user_id, id\)/i
    );
    expect(schemaSql).toMatch(
      /create table public\.transactions[\s\S]*foreign key \(user_id, category_id\)[\s\S]*references public\.categories \(user_id, id\)[\s\S]*on delete set null \(category_id\)/i
    );
    expect(schemaSql).toMatch(
      /create table public\.recurring_items[\s\S]*foreign key \(user_id, category_id\)[\s\S]*references public\.categories \(user_id, id\)/i
    );
    expect(schemaSql).toMatch(
      /create table public\.recurring_items[\s\S]*foreign key \(user_id, category_id\)[\s\S]*references public\.categories \(user_id, id\)[\s\S]*on delete set null \(category_id\)/i
    );
  });

  it("bootstraps a profile row for each new auth user", () => {
    expect(schemaSql).toMatch(
      /create function public\.handle_new_user\(\)[\s\S]*security definer/i
    );
    expect(schemaSql).toMatch(
      /create trigger on_auth_user_created[\s\S]*after insert on auth\.users[\s\S]*execute function public\.handle_new_user\(\)/i
    );
  });

  it("keeps updated_at current via reusable trigger logic", () => {
    expect(schemaSql).toMatch(
      /create function public\.set_updated_at\(\)[\s\S]*new\.updated_at = now\(\)/i
    );

    const updatedAtTriggerMatches =
      schemaSql.match(/create trigger [\w_]+_set_updated_at/gi) ?? [];

    expect(updatedAtTriggerMatches).toHaveLength(9);
  });
});
