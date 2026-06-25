# Break-glass SQL kit

For when something goes wrong mid-event and you don't have time to debug.
Every file is a single self-contained snippet. Edit the email/id at the top,
paste into Supabase SQL editor, run.

## Roster fixes

| File | When to use |
|---|---|
| [`promote_admin.sql`](promote_admin.sql) | Make someone admin without using the UI |
| [`demote_admin.sql`](demote_admin.sql) | Revoke admin |
| [`add_participant.sql`](add_participant.sql) | Manually add someone (UI broken) |
| [`nuke_user.sql`](nuke_user.sql) | Remove a user and all their data |

## Phase + submission fixes

| File | When to use |
|---|---|
| [`force_approve_phase.sql`](force_approve_phase.sql) | Approve one user's phase without UI |
| [`reset_phase.sql`](reset_phase.sql) | Wipe a user's phase entry so they can resubmit |
| [`bulk_approve_phase1.sql`](bulk_approve_phase1.sql) | EMERGENCY — auto-approve everyone's phase 1 (workshop fell behind) |
| [`delete_submission.sql`](delete_submission.sql) | Remove a bad/test submission |

## Chat fixes

| File | When to use |
|---|---|
| [`wipe_chat.sql`](wipe_chat.sql) | Delete every message |
| [`delete_user_messages.sql`](delete_user_messages.sql) | Delete one user's messages |
| [`fix_realtime.sql`](fix_realtime.sql) | Re-add messages to realtime if cross-tab stops updating |

## Diagnostics

| File | When to use |
|---|---|
| [`health_check.sql`](health_check.sql) | Sanity-check every critical piece. Run when something feels off. |
| [`nuke_all_policies.sql`](nuke_all_policies.sql) | Last resort: blast every RLS policy and reinstall one open one per table |
