-- Manually approve / reject / re-pend one submission by user email.
-- Replace the email + status string and run.

update public.submissions
   set gallery_status = 'approved',  -- 'approved' | 'rejected' | 'pending'
       gallery_note   = null
 where lower(user_email) = lower('REPLACE_ME@example.com');
