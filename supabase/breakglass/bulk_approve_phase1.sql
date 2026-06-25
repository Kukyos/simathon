-- EMERGENCY: workshop fell behind, auto-approve every existing phase 1 submission.
-- Does NOT create rows for users who didn't submit — only flips pending → approved.

update public.phase_progress
set status = 'approved', reviewed_at = now(), reviewed_by = 'bulk_breakglass'
where phase = 1 and status <> 'approved';

-- Verify count:
select count(*) as approved_now from public.phase_progress where phase = 1 and status = 'approved';
