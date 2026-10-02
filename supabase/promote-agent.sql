-- Promotes a user to the 'agent' role by email in Supabase.
-- Replace 'agent@example.com' with the user's actual registered email address.

update public.profiles
set role = 'agent'
where id = (
  select id
  from auth.users
  where email = 'agent@example.com'
  limit 1
);