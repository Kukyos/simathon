# Workshop site

One-day Taichi workshop + week-long hackathon. Deploys to Vercel, backed by Supabase
for auth, chat, phase tracking, and submissions.

## Pages

- `/` — personalized handbook home (shows your phase progress when signed in)
- `/login` — magic-link sign-in, pre-fills last-used email
- `/onboard` — captures name + platform + GPU after first login (forced once)
- `/setup` — installs (Python + Cursor)
- `/workshop` — master prompt + idea gallery
- `/phase/1` — setup verification (upload screenshot)
- `/phase/2` — first sim running (upload screenshot/clip)
- `/hackathon` — rules + judging + prizes
- `/submit` — locked until both phases approved
- `/gallery` and `/gallery/[id]` — public showcase
- `/participants` — live roster, who's signed in, who's submitted
- `/chat` — realtime room, 5s rate limit, purple glow on admin messages
- `/admin` — admin-only: review pending phases, add/remove participants, toggle admin flag

## First-time deploy

### 1. Supabase project

1. Make a Supabase project. Mumbai region.
2. SQL editor → run each migration in order:
   - `supabase/schema.sql`
   - `supabase/migrations/002_participants.sql`
   - `supabase/migrations/003_phases_admin_chat.sql`
   - `supabase/migrations/004_storage.sql`
   - `supabase/migrations/005_profile_rpc_and_admin_add.sql`
   - `supabase/migrations/006_relax_rls.sql`
3. Authentication → Providers → Email — on. Confirm-email — off.
4. Authentication → URL Configuration:
   - Site URL: `https://<vercel-url>`
   - Redirect URLs: `https://<vercel-url>/auth/callback`

### 2. Make yourself the first admin

Run in SQL editor:

```sql
insert into public.allowed_emails (email, full_name, is_admin)
values ('amohamedarmaan@gmail.com', 'Armaan', true)
on conflict (email) do update set is_admin = true;
```

From here you can promote others from the `/admin` page (no more SQL needed).

### 3. Vercel

Env vars:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_SITE_URL=https://<vercel-url>
```

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in
npm run dev
```

## How the moving parts fit

- Auth state lives in Supabase cookies. Middleware refreshes them on every request,
  so sessions are persistent until they hit the Supabase token TTL (~30 days).
- The middleware forces logged-in users without a `profiles` row to `/onboard`.
- Phase RPCs (`review_phase`, `admin_add_participant`, etc.) check the admin flag
  inside the function — there is no client-side trust.
- Chat posts go through `post_message()` which enforces the 5s rate limit server-side.
- Phase proof uploads go to the `phase_proofs` storage bucket. The RLS policy on
  the bucket pins uploads to a folder named after the user's email.

## Tweaks you'll probably want

- Workshop dates: search for `[[TBD]]` in `app/hackathon/page.tsx`.
- Number of phases: edit `lib/phases.ts`. SQL constraint allows up to 3 — bump if you want more.
- Rate limit window: `interval '5 seconds'` in `003_phases_admin_chat.sql` (post_message function).
- Master prompt: top of `app/workshop/page.tsx`.

## Notes (intentional shortcuts)

- One submission per user (unique constraint on `user_email`).
- Phase track is hardcoded to 2 phases. Bump `lib/phases.ts` + the SQL check.
- Chat is a single global room. No threads, no DMs.
- File uploads cap at whatever Supabase's default is (~50 MB). Tighten if needed.
- The participants page polls every 15s. Swap to a realtime subscription if you want true live presence.
