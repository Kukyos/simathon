-- 015: customizable polls.
-- Options are now an array (2-4 entries). multi_choice lets a voter pick several.
-- default_no flips the tally semantics: numerator = votes for options[0], denominator = total participants.

alter table public.polls
  add column if not exists options text[] not null default array['Yes','No'],
  add column if not exists multi_choice boolean not null default false,
  add column if not exists default_no boolean not null default false;

-- Loosen the hard-coded yes/no check; we now validate against options[] client-side.
alter table public.poll_votes drop constraint if exists poll_votes_choice_check;

-- Multi-choice means a voter can have several rows on the same poll.
-- Switch the PK from (poll_id, user_email) to (poll_id, user_email, choice).
alter table public.poll_votes drop constraint if exists poll_votes_pkey;
alter table public.poll_votes add primary key (poll_id, user_email, choice);
