create schema if not exists "sniperok";

-- https://youtu.be/NZEbVe47DfA?t=768
create or replace view "sniperok"."user"
    with (security_invoker=on)
as
select id, email, raw_user_meta_data ->> 'username' as username, created_at
  from auth.users u
;

CREATE OR REPLACE FUNCTION sniperok.fn_touch_updated_at() 
    RETURNS trigger
    LANGUAGE plpgsql
    set search_path = ''
AS $func$
begin
    new.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$;

