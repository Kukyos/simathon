-- Mark every existing submission as approved so they show up in the gallery.
-- Use after 016 if any new submissions snuck in as 'pending' and you want a clean slate.
update public.submissions set gallery_status = 'approved' where gallery_status <> 'approved';
