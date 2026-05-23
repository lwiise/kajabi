create table coupons (
  id bigint generated always as identity primary key,
  code text unique,
  used boolean default false,
  assigned_to text,
  created_at timestamp default now()
);

insert into coupons (code) values
('FREE100'),
('FREE101'),
('FREE102');

create or replace function get_coupon()
returns table(code text)
language sql
as $$
  update coupons
  set used = true,
      assigned_to = null
  where id = (
    select id
    from coupons
    where used = false
    limit 1
    for update skip locked
  )
  returning code;
$$;
