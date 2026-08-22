alter table public.audit_events
  drop constraint if exists audit_events_user_id_fkey;

alter table public.audit_events
  alter column user_id drop not null;

alter table public.audit_events
  add constraint audit_events_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
