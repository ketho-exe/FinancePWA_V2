# FinancePWA

Personal finance app built in Next.js for Vercel, with a Windows 95 visual layer and a low-clutter route-based workflow.

## Run locally

```bash
npm install
npm run dev
```

After adding your Supabase environment variables, the app boots into email/password auth and loads your personal workspace from the database.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add your public Supabase URL and anon key.
5. Deploy to Vercel with the same environment variables.

## Notes

- The app now requires Supabase auth and a configured database to run.
- On first sign-in, it creates a single personal workspace and starter categories automatically.
- All visible create/delete actions in the UI read from and write back to Supabase.
