create table public.units (
  id varchar not null,
  updated_at timestamptz not null default now(),
  rent integer not null,
  electricity integer,
  water integer,
  gas integer,
  garbage integer,
  service_charge integer,
  advance integer,
  constraint units_pkey primary key (id)
);

alter table public.units enable row level security;

create policy "Owner full access" on public.units
  as permissive for all to authenticated
  using (true) with check (true);

grant select, insert, update, delete, truncate, references, trigger on public.units to authenticated;

comment on column public.units.advance is
  'Reserved, unused. Null for every row; no application code reads or writes it.';
