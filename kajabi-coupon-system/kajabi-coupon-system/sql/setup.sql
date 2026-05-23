-- =========================================================
-- KAJABI COUPON SYSTEM - SUPABASE SETUP
-- Run this entire file in Supabase -> SQL Editor
-- =========================================================

-- 1. Create the coupons table
create table if not exists coupons (
  id bigint generated always as identity primary key,
  code text unique not null,
  used boolean default false,
  assigned_to text,
  assigned_at timestamptz,
  created_at timestamptz default now()
);

-- 2. (Optional) Insert a few test codes
-- For your real codes, use the bulk insert file
insert into coupons (code) values
  ('FREE100'),
  ('FREE101'),
  ('FREE102')
on conflict (code) do nothing;

-- 3. Atomic coupon assignment function
-- Takes the user's email, assigns one unused coupon to them,
-- and returns the code. Uses FOR UPDATE SKIP LOCKED so
-- concurrent requests cannot grab the same code.
create or replace function get_coupon(user_email text)
returns table(code text)
language sql
as $$
  update coupons
  set used = true,
      assigned_to = user_email,
      assigned_at = now()
  where id = (
    select id
    from coupons
    where used = false
    order by id
    limit 1
    for update skip locked
  )
  returning coupons.code;
$$;
