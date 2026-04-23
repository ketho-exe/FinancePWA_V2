# FinancePWA

Personal finance app built in Next.js for Vercel, with a Windows 95 visual layer and a low-clutter route-based workflow.

## Run locally

```bash
npm install
npm run dev
```

The app works immediately in preview mode and stores data in local browser storage so the UI can be reviewed before backend setup.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add your public Supabase URL and anon key.
5. Deploy to Vercel with the same environment variables.

## Notes

- Current build focuses on the product shell, page flows, and clean personal-finance UX from the supplied documents.
- The workspace provider currently uses local preview data so the product is reviewable without blocking on auth or database wiring.
- Supabase helpers and schema are included so you can connect persistence next without redesigning the app structure.
