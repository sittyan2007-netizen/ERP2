# Gemstone ERP (Supabase + Vite)

A lightweight ERP-style web app designed to replicate the workflows in the Excel workbook and PRD. The UI mirrors the provided screenshots and uses Supabase for shared, multi-user data storage. Writes are protected by a shared company passcode via Supabase Edge Functions.

## Project Structure

```
/ frontend            # Vite + React + TypeScript UI
/ supabase
  / schema.sql        # Tables, indexes, triggers, RLS
  / functions         # Passcode-protected Edge Functions
```

## Supabase Setup

1. Create a Supabase project.
2. In the SQL editor, run `supabase/schema.sql` to create tables and policies.
3. Deploy edge functions:
   ```bash
   supabase functions deploy inventory
   supabase functions deploy sell
   supabase functions deploy invoice
   supabase functions deploy memo
   supabase functions deploy production
   supabase functions deploy ledger
   supabase functions deploy import
   ```
4. Set function environment variables:
   - `COMPANY_PASSCODE` (shared passcode)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key)

## Frontend Setup

1. Create `frontend/.env.local`:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
   ```
2. Install dependencies and run locally:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Build:
   ```bash
   npm run build
   ```

## GitHub Pages Deployment

The workflow builds `/frontend` and deploys to `gh-pages`. The Vite base path is set automatically.

1. Push to GitHub.
2. Ensure GitHub Pages is enabled for the `gh-pages` branch.
3. The app will be available at:

```
https://username.github.io/<repo>
```

## Importing the Excel Workbook

Use **Inventory → Import Workbook** to upload the Excel file. The importer normalizes sheets into Supabase tables and returns an unmapped sheet summary if any are not mapped.

## Security Model

- Public reads are allowed via Supabase RLS SELECT policies.
- All writes go through Edge Functions.
- The frontend sends `X-COMPANY-PASSCODE` on every write request.

## Notes

- Printable invoices use browser print styles.
- Use the passcode modal to enable write actions.
