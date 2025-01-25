create schema if not exists sniperok;

-- ----------------------------------------------------------------------------
--          STATUS
--          common status table used by GAME and GAME_PLAYER
--          values include (pending, active, inactive, active_curator)
-- ----------------------------------------------------------------------------
create table sniperok.status (
    id smallint generated by default as identity not null,
    code text not null,
    CONSTRAINT status_pk
        PRIMARY KEY (id)
);

-- ----------------------------------------------------------------------------
--          GAME
-- ----------------------------------------------------------------------------
create table sniperok.game (
    id bigint generated by default as identity not null,
    status_id smallint not null default 1,
    is_public boolean not null default false,
    rounds smallint not null default '3'::smallint,
    min_players smallint not null default '2'::smallint,
    start_time timestamp not null,
    CONSTRAINT game_pk
        PRIMARY KEY (id),
    CONSTRAINT game_status_fk
        FOREIGN KEY (status_id) REFERENCES sniperok.status(id)
);

-- ----------------------------------------------------------------------------
--          GAME_PLAYER
-- ----------------------------------------------------------------------------
create table sniperok.game_player (
    game_id bigint not null,
    player_uuid uuid not null,
    player_seq smallint not null default 1,
    status_id smallint not null default 1,
    CONSTRAINT game_player_pk
        PRIMARY KEY (game_id, player_uuid),
    CONSTRAINT game_player_game_seq_uq
        UNIQUE (game_id, player_seq),
    CONSTRAINT game_player_game_fk
        FOREIGN KEY (game_id) REFERENCES sniperok.game(id),
    CONSTRAINT game_player_status_fk
        FOREIGN KEY (status_id) REFERENCES sniperok.status(id)
);

-- alter table "sniperok"."game_player" enable row level security;

-- ----------------------------------------------------------------------------
--          GAME_ROUND
-- ----------------------------------------------------------------------------
create table sniperok.game_round (
    game_id bigint not null,
    round_seq smallint not null,
    status_id smallint not null default 1,
    CONSTRAINT game_round_pk
        PRIMARY KEY (game_id, round_seq),
    CONSTRAINT game_round_game_fk
        FOREIGN key (game_id) REFERENCES sniperok.game(id),
    CONSTRAINT game_round_status_fk
        FOREIGN KEY (status_id) REFERENCES sniperok.status(id)
);

-- ----------------------------------------------------------------------------
--          WEAPON
-- ----------------------------------------------------------------------------
create table sniperok.weapon (
    code text not null,
    level smallint not null default '1'::smallint,
    CONSTRAINT weapon_pk
        PRIMARY KEY (code)
);

-- ----------------------------------------------------------------------------
--          WEAPON_VICTORY
--          winner_weapon_code beats loser_weapon_code
--          rock beats scissors, scissors beats paper, paper beats rock
-- ----------------------------------------------------------------------------
create table sniperok.weapon_victory (
    winner_weapon_code text not null,
    loser_weapon_code text not null,
    CONSTRAINT weapon_victory_pk
        PRIMARY KEY (winner_weapon_code, loser_weapon_code),
    CONSTRAINT weapon_victory_fk1
        FOREIGN KEY (winner_weapon_code) REFERENCES sniperok.weapon(code),
    CONSTRAINT weapon_victory_fk2
        FOREIGN KEY (loser_weapon_code) REFERENCES sniperok.weapon(code)
);

-- ----------------------------------------------------------------------------
--          PLAYER_TURN
-- ----------------------------------------------------------------------------
create table sniperok.player_turn (
    game_id bigint not null,
    player_uuid uuid not null,
    round_seq smallint not null,
    weapon_code text not null,
    response_time_millis smallint not null,
    CONSTRAINT player_turn_pk
        PRIMARY KEY (game_id, round_seq, player_uuid),
    CONSTRAINT player_turn_game_fk
        FOREIGN key (game_id) REFERENCES sniperok.game(id),
    CONSTRAINT player_turn_weapon_fk
        FOREIGN KEY (weapon_code) REFERENCES sniperok.weapon(code)
);

create or replace view sniperok.round_score as (
    with turns as (
        select gr.game_id, gr.round_seq
            ,u.username
            ,gp.player_seq
            ,pt.weapon_code
            ,pt.response_time_millis
        from sniperok.game_round gr
        join sniperok.game_player gp
            on gp.game_id = gr.game_id
        join sniperok.status gps
            on gps.id = gp.status_id
        and gps.code = 'active'
        join sniperok.user u
            on u.id = gp.player_uuid
        left join sniperok.player_turn pt
            on pt.game_id = gr.game_id
        and pt.round_seq = gr.round_seq
        and pt.player_uuid = gp.player_uuid
        where gr.game_id = 1
        and gr.round_seq = 1
    ),
    scores as (
        select player.*,
                sum(case when
                    (player.weapon_code = ww.winner_weapon_code and opponent.weapon_code = ww.loser_weapon_code)
                    or (player.weapon_code is not null and opponent.weapon_code is null)
                    then 1 else 0 end) as wins,
                sum(case when
                    (player.weapon_code = wl.loser_weapon_code and opponent.weapon_code = wl.winner_weapon_code)
                    or (player.weapon_code is null and opponent.weapon_code is not null)
                    then 1 else 0 end) as losses,
                sum(case when
                    (player.weapon_code = opponent.weapon_code)
                    or (player.weapon_code is null and opponent.weapon_code is null)
                    then 1 else 0 end) as ties
            from turns player
            cross join turns opponent
            left join sniperok.weapon_victory ww
            on ww.winner_weapon_code = player.weapon_code
            left join sniperok.weapon_victory wl
            on wl.loser_weapon_code = player.weapon_code
            where player.player_seq != opponent.player_seq
            group by player.game_id, player.round_seq, player.username, player.player_seq, 
                    player.weapon_code, player.response_time_millis
    )
    select game_id,
        round_seq,
        username,
        player_seq,
        weapon_code,
        response_time_millis,
        wins,
        losses,
        ties,
        wins - losses as score
    from scores
    order by score desc, response_time_millis
);