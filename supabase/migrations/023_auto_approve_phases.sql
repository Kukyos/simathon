-- Mid-workshop change: phase gates are removed; participants submit the final
-- entry directly. Auto-approve every existing phase row so nothing is left
-- hanging in "pending" or "rejected" state and admin dashboards stay clean.

update public.phase_progress
set status = 'approved',
    reviewed_at = coalesce(reviewed_at, now()),
    reviewed_by = coalesce(reviewed_by, 'system:auto-approve')
where status <> 'approved';
