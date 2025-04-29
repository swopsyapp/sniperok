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

insert into sniperok.status ("id", "code") values
(1, 'pending'), (2, 'active'), (3, 'inactive'),
(4, 'active_curator');

insert into sniperok.weapon ("code", "level") values
('rock', 1), ('paper', 1), ('scissors', 1),
('bazooka', 2), ('dynamite', 2), ('shotgun', 2);

insert into sniperok.weapon_victory (winner_weapon_code, loser_weapon_code) VALUES
('paper', 'rock'), ('paper', 'shotgun'),
('scissors', 'paper'), ('scissors', 'dynamite'),
('rock', 'scissors'), ('rock', 'bazooka'),
('dynamite', 'rock'), ('dynamite', 'paper'), ('dynamite', 'bazooka'),
('bazooka', 'paper'), ('bazooka', 'scissors'), ('bazooka', 'shotgun'),
('shotgun', 'scissors'), ('shotgun', 'rock'), ('shotgun', 'dynamite')
;

insert into sniperok.boost_type (code, description) values
('snaps', 'Can be swapped for power-ups'),
('dynamite', 'Beats rock, paper and bazooka'),
('bazooka', 'Beats paper, scissors and shotgun'),
('shotgun', 'Beats scissors, rock and dynamite')
;