-- Optional defence-in-depth RLS for API/reporting connections.
-- Prerequisite: after JWT validation the API runs, inside every transaction:
--   select set_config('zaberman.user_id', '<app_users.id>', true);
-- End-user devices must never receive direct PostgreSQL credentials.

begin;
set search_path = zaberman, public;

create function current_app_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('zaberman.user_id', true), '')::uuid
$$;

create function has_branch_access(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = zaberman, pg_temp
as $$
  select exists (
    select 1
    from user_branch_roles ubr
    join app_users u on u.id = ubr.user_id
    where ubr.user_id = (select current_app_user_id())
      and ubr.branch_id = target_branch_id
      and (ubr.valid_until is null or ubr.valid_until > now())
      and u.status = 'active'
  )
$$;

create function can_read_order(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = zaberman, pg_temp
as $$
  select exists (
    select 1
    from orders o
    where o.id = target_order_id
      and (
        (o.origin_branch_id is not null and has_branch_access(o.origin_branch_id))
        or (o.destination_branch_id is not null and has_branch_access(o.destination_branch_id))
      )
  )
$$;

create function can_read_trip(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = zaberman, pg_temp
as $$
  select exists (
    select 1
    from trips t
    where t.id = target_trip_id
      and (has_branch_access(t.origin_branch_id) or has_branch_access(t.destination_branch_id))
  )
$$;

create function can_read_place(target_place_id uuid)
returns boolean
language sql
stable
security definer
set search_path = zaberman, pg_temp
as $$
  select exists (
    select 1
    from cargo_places p
    where p.id = target_place_id
      and can_read_order(p.order_id)
  )
$$;

create function can_read_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = zaberman, pg_temp
as $$
  select
    target_user_id = (select current_app_user_id())
    or exists (
      select 1
      from user_branch_roles target_role
      join user_branch_roles my_role on my_role.branch_id = target_role.branch_id
      where target_role.user_id = target_user_id
        and my_role.user_id = (select current_app_user_id())
        and (target_role.valid_until is null or target_role.valid_until > now())
        and (my_role.valid_until is null or my_role.valid_until > now())
    )
    or exists (
      select 1
      from place_events e
      where e.actor_user_id = target_user_id
        and has_branch_access(e.branch_id)
    )
$$;

alter table branches enable row level security;
alter table app_users enable row level security;
alter table devices enable row level security;
alter table user_branch_roles enable row level security;
alter table route_runs enable row level security;
alter table orders enable row level security;
alter table tasks enable row level security;
alter table vehicles enable row level security;
alter table trips enable row level security;
alter table command_requests enable row level security;
alter table work_operations enable row level security;
alter table cargo_items enable row level security;
alter table cargo_places enable row level security;
alter table cargo_item_places enable row level security;
alter table cargo_place_measurements enable row level security;
alter table place_label_aliases enable row level security;
alter table operation_places enable row level security;
alter table place_events enable row level security;
alter table manifest_versions enable row level security;
alter table manifest_places enable row level security;
alter table discrepancies enable row level security;
alter table discrepancy_events enable row level security;
alter table media_objects enable row level security;
alter table documents enable row level security;
alter table document_versions enable row level security;
alter table signatures enable row level security;
alter table document_signatures enable row level security;
alter table document_snapshots enable row level security;
alter table order_media enable row level security;
alter table cargo_place_media enable row level security;
alter table work_operation_media enable row level security;
alter table document_version_media enable row level security;
alter table integration_entity_links enable row level security;
alter table integration_attempts enable row level security;
alter table outbox_messages enable row level security;
alter table device_sync_checkpoints enable row level security;
alter table audit_log enable row level security;

create policy branches_read on branches for select
  using ((select has_branch_access(id)));
create policy users_read on app_users for select
  using ((select can_read_user(id)));
create policy devices_read on devices for select
  using (user_id = (select current_app_user_id()));
create policy user_branch_roles_read on user_branch_roles for select
  using (user_id = (select current_app_user_id()));
create policy route_runs_read on route_runs for select
  using ((select has_branch_access(branch_id)));
create policy orders_read on orders for select
  using ((select can_read_order(id)));
create policy tasks_read on tasks for select
  using ((select has_branch_access(branch_id)));
create policy vehicles_read on vehicles for select
  using (home_branch_id is null or (select has_branch_access(home_branch_id)));
create policy trips_read on trips for select
  using ((select can_read_trip(id)));
create policy command_requests_read on command_requests for select
  using (actor_user_id = (select current_app_user_id()) or (select has_branch_access(branch_id)));
create policy work_operations_read on work_operations for select
  using ((select has_branch_access(branch_id)));
create policy cargo_items_read on cargo_items for select
  using ((select can_read_order(order_id)));
create policy cargo_places_read on cargo_places for select
  using ((select can_read_order(order_id)));
create policy cargo_item_places_read on cargo_item_places for select
  using ((select can_read_place(cargo_place_id)));
create policy measurements_read on cargo_place_measurements for select
  using ((select can_read_place(cargo_place_id)));
create policy labels_read on place_label_aliases for select
  using ((select can_read_place(cargo_place_id)));
create policy operation_places_read on operation_places for select
  using ((select can_read_place(cargo_place_id)));
create policy place_events_read on place_events for select
  using ((select has_branch_access(branch_id)) and (select can_read_place(cargo_place_id)));
create policy manifest_versions_read on manifest_versions for select
  using ((select can_read_trip(trip_id)));
create policy manifest_places_read on manifest_places for select
  using (
    (select can_read_place(cargo_place_id))
    and exists (
      select 1 from manifest_versions mv
      where mv.id = manifest_places.manifest_version_id
        and can_read_trip(mv.trip_id)
    )
  );
create policy discrepancies_read on discrepancies for select
  using ((select has_branch_access(branch_id)));
create policy discrepancy_events_read on discrepancy_events for select
  using (exists (
    select 1 from discrepancies d
    where d.id = discrepancy_events.discrepancy_id
      and has_branch_access(d.branch_id)
  ));
create policy media_objects_read on media_objects for select
  using ((select has_branch_access(branch_id)));
create policy documents_read on documents for select
  using ((select has_branch_access(branch_id)));
create policy document_versions_read on document_versions for select
  using (exists (
    select 1 from documents d
    where d.id = document_versions.document_id
      and has_branch_access(d.branch_id)
  ));

-- No policies are intentionally defined for signatures, document/media link tables,
-- integrations, outbox, checkpoints, or audit. Only the table owner/background roles
-- can access them until an explicit least-privilege use case is approved.

revoke all on function current_app_user_id() from public;
revoke all on function has_branch_access(uuid) from public;
revoke all on function can_read_order(uuid) from public;
revoke all on function can_read_trip(uuid) from public;
revoke all on function can_read_place(uuid) from public;
revoke all on function can_read_user(uuid) from public;

commit;
