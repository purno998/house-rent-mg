create table public.monthly_rents (
  unit_id varchar not null,
  month date not null,
  rent integer not null,
  electricity integer,
  water integer,
  gas integer,
  garbage integer,
  service_charge integer,
  due integer,
  note varchar,
  updated_at timestamptz not null default now(),
  constraint monthly_rents_pkey primary key (unit_id, month),
  constraint monthly_rents_unit_id_fkey foreign key (unit_id) references public.units (id),
  constraint month_is_first_of_month check (month = (date_trunc('month', month::timestamptz))::date)
);

alter table public.monthly_rents enable row level security;

create policy "Owner full access" on public.monthly_rents
  as permissive for all to authenticated
  using (true) with check (true);

grant select, insert, update, delete, truncate, references, trigger on public.monthly_rents to authenticated;
