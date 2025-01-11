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
    status_id smallint not null default 1,
    CONSTRAINT game_player_pk
        PRIMARY KEY (game_id, player_uuid),
    CONSTRAINT game_player_game_fk
        FOREIGN KEY (game_id) REFERENCES sniperok.game(id),
    CONSTRAINT game_player_status_fk
        FOREIGN KEY (status_id) REFERENCES sniperok.status(id)
);

-- alter table "sniperok"."game_player" enable row level security;

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
--          weapon_code beats versus_code
--          rock beats scissors, scissors beats paper, paper beats rock
-- ----------------------------------------------------------------------------
create table sniperok.weapon_victory (
    weapon_code text not null,
    versus_code text not null,
    CONSTRAINT weapon_victory_pk
        PRIMARY KEY (weapon_code, versus_code),
    CONSTRAINT weapon_victory_fk1
        FOREIGN KEY (weapon_code) REFERENCES sniperok.weapon(code),
    CONSTRAINT weapon_victory_fk2
        FOREIGN KEY (versus_code) REFERENCES sniperok.weapon(code)
);

-- ----------------------------------------------------------------------------
--          PLAYER_TURN
-- ----------------------------------------------------------------------------
create table sniperok.player_turn (
    game_id bigint not null,
    round_seq smallint not null,
    player_uuid text not null,
    weapon_code text,
    response_time_millis smallint,
    CONSTRAINT player_turn_pk
        PRIMARY KEY (game_id, round_seq, player_uuid),
    CONSTRAINT player_turn_game_fk
        FOREIGN key (game_id) REFERENCES sniperok.game(id)
);
