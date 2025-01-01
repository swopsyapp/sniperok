
-- Created with `supabase migration new create_buddy_table`

-- ----------------------------------------------------------------------------
--         BUDDY
-- ----------------------------------------------------------------------------
create table "sniperok"."buddy" (
    "player_uuid" uuid not null,
    "buddy_uuid" uuid not null,
    "status_id" smallint not null default 1
);

-- alter table "sniperok"."buddy" enable row level security;

CREATE UNIQUE INDEX buddy_pk ON sniperok.buddy USING btree (player_uuid, buddy_uuid);

alter table "sniperok"."buddy" add constraint "buddy_pk" PRIMARY KEY using index "buddy_pk";

-- ----------------------------------------------------------------------------
--         BUDDY_VW
-- ----------------------------------------------------------------------------
create or replace view "sniperok"."buddy_vw"
    with (security_invoker=on)
as
select p.raw_user_meta_data ->> 'username' as player, b.raw_user_meta_data ->> 'username' as buddy, t.status_id, s.code as status_code
  from sniperok.buddy t
  join auth.users p
    on p.id = t.player_uuid
  join auth.users b
    on b.id = t.buddy_uuid
  join sniperok.status s
    on s.id = t.status_id
;
