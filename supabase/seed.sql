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

insert into sniperok.weapon ("code", "level") values
('rock', 1), ('paper', 1), ('scissors', 1),
('bazooka', 2), ('dynamite', 2), ('shotgun', 2);

insert into sniperok.weapon_victory (weapon_code, versus_code) VALUES
('paper', 'rock'), ('scissors', 'paper'), ('rock', 'scissors');
