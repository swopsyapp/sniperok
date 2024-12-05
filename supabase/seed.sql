INSERT INTO
    auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) (
        with usr as (
          select 'test' || (ROW_NUMBER() OVER ()) as name
            from generate_series(1, 5)
        )
        select
            '00000000-0000-0000-0000-000000000000',
            uuid_generate_v4 (),
            'authenticated',
            'authenticated',
            usr.name || '@test.com',
            crypt ('Password123', gen_salt ('bf')),
            current_timestamp,
            current_timestamp,
            current_timestamp,
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('username', usr.name),
            current_timestamp,
            current_timestamp,
            '',
            '',
            '',
            ''
        FROM usr
    );

insert into junowot.league(name, owner)
values ('public', uuid_generate_v4());

insert into junowot.league_member_status(code)
values ('pending'), ('active'), ('banned');

insert into junowot.league (name, owner)
select 'Test1 friends league', users.id
  from auth.users
 where users.email like 'test1%'
;

insert into junowot.league_member(league_id, member_uuid, status_code, is_curator)
select l.id as league_id, u.id as member_uuid, 'active' as status_code, true as is_curator
  from junowot.league l
  join auth.users u
    on u.email like 'test1%'
 where l.name like 'Test1%'
;

insert into junowot.league_member(league_id, member_uuid, status_code, is_curator)
select l.id as league_id, u.id as member_uuid, 'active' as status_code, false as is_curator
  from junowot.league l
  join auth.users u
    on u.email like 'test2%'
 where l.name like 'Test1%'
;

insert into junowot.league_member(league_id, member_uuid, status_code)
select l.id as league_id, u.id as member_uuid, 'pending' as status_code
  from junowot.league l
  join auth.users u
    on u.email like 'test3%'
 where l.name like 'Test1%'
;
