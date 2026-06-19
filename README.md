# Workshop site

One-day Taichi workshop + week-long hackathon, in one site. Deploys to Vercel,
backed by Supabase for auth, chat, and submissions.

## What's in the box

- **Landing** (`/`) — the pitch
- **Setup** (`/setup`) — pre-workshop install guide
- **Workshop** (`/workshop`) — the full tutorial (this IS the recording)
- **Hackathon** (`/hackathon`) — rules, theme, judging, prizes
- **Submit** (`/submit`) — authenticated submission form (one per user, editable)
- **Gallery** (`/gallery`) — everyone's submissions
- **Chat** (`/chat`) — realtime Q&A
- **Login** (`/login`) — magic-link, gated by email allowlist

## First-time deploy (do this once)

### 1. Supabase (~5 min)

1. Make an account at [supabase.com](https://supabase.com), create a new project. Pick the region closest to India (e.g. Mumbai).
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → run.
3. Open **Authentication → Providers → Email** → make sure "Enable Email provider" is on. Disable "Confirm email" (we use magic links, not signup confirmations).
4. **Authentication → URL Configuration**:
   - Site URL: `https://your-vercel-url.vercel.app`
   - Redirect URLs: add `https://your-vercel-url.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`
5. **Project Settings → API** → copy the `Project URL` and the `anon` public key. You'll need them in step 3.

### 2. Add your roster

Once Yuvika sends the participant email list, paste it in via SQL Editor:

```sql
insert into public.allowed_emails (email, full_name) values
  ('participant1@example.com', 'Name One'),
  ('participant2@example.com', 'Name Two')
on conflict (email) do nothing;
```

Don't forget your own email so you can test:

```sql
insert into public.allowed_emails (email, full_name)
values ('amohamedarmaan@gmail.com', 'Armaan')
on conflict (email) do nothing;
```

### 3. Vercel (~3 min)

1. Push this folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com), import the repo.
3. Add three environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` → from Supabase step 5
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → from Supabase step 5
   - `NEXT_PUBLIC_SITE_URL` → your `https://...vercel.app` URL
4. Deploy.
5. Go back to Supabase → Authentication → URL Configuration → make sure the live Vercel URL is in there.

## Local dev

```bash
cd workshop-site
cp .env.example .env.local   # fill in the Supabase values
npm install
npm run dev
```

Visit http://localhost:3000.

## Day-of-workshop checklist

- [ ] Roster loaded in `allowed_emails`
- [ ] Test login flow with your own email
- [ ] Send participants the site URL + a one-liner: "log in with the email you registered with"
- [ ] Open `/chat` on a second monitor so you can see questions roll in
- [ ] Have the workshop page open in a tab — that's your teleprompter

## Tweaks you'll probably want

- Workshop dates: hardcoded text in `app/page.tsx` and `app/hackathon/page.tsx` — find the date strings and replace.
- Prize split: `app/hackathon/page.tsx`.
- Tutorial content (`app/workshop/page.tsx`) — proof-read the physics constants and tune them on your machine before the live session.

## Notes

- The allowlist gate is enforced at the Postgres RLS layer. Even if someone gets a magic link, they cannot read or write any table unless their email is in `allowed_emails`.
- One submission per user, enforced by a unique constraint on `submissions.user_email`. The submit form upserts, so editing is just re-submitting.
- The chat is a single global room, by design. Threads + DMs are scope creep for a 1-week event.
