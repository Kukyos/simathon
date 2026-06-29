-- 016: gallery moderation.
-- New submissions default to 'pending'. Admin must approve before they appear in /gallery.
-- 'rejected' is shown back to the submitter with an optional note.

alter table public.submissions
  add column if not exists gallery_status text not null default 'pending'
    check (gallery_status in ('pending','approved','rejected')),
  add column if not exists gallery_note text;

-- Don't break the existing gallery on deploy: anyone already submitted is grandfathered in.
update public.submissions
   set gallery_status = 'approved'
 where gallery_status = 'pending';
