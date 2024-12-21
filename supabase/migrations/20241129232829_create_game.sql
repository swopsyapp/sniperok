create schema if not exists "sniperok";

-- ----------------------------------------------------------------------------
--         GAME
-- ----------------------------------------------------------------------------
create table "sniperok"."game" (
    "id" bigint generated by default as identity not null,
    "is_public" boolean not null default false,
    "rounds" smallint not null default '3'::smallint,
    "min_players" smallint not null default '2'::smallint,
    "start_time" timestamp
);

CREATE UNIQUE INDEX game_pk ON sniperok.game USING btree (id);

alter table "sniperok"."game" add constraint "game_pk" PRIMARY KEY using index "game_pk";

-- ----------------------------------------------------------------------------
--         GAME_PLAYER
-- ----------------------------------------------------------------------------
create type "sniperok"."player_status" AS ENUM ('pending', 'active', 'inactive');

create table "sniperok"."game_player" (
    "game_id" bigint not null,
    "player_uuid" uuid not null,
    "status" sniperok.player_status not null default 'pending'
);

-- alter table "sniperok"."game_player" enable row level security;

CREATE UNIQUE INDEX game_player_pk ON sniperok.game_player USING btree (game_id, player_uuid);

alter table "sniperok"."game_player" add constraint "game_player_pk" PRIMARY KEY using index "game_player_pk";

alter table "sniperok"."game_player" add constraint "game_player_game_id_fkey" FOREIGN KEY (game_id) REFERENCES sniperok.game(id) not valid;

-- ----------------------------------------------------------------------------
--         WEAPON
-- ----------------------------------------------------------------------------
create table "sniperok"."weapon" (
    "code" text not null,
    "level" smallint not null default '1'::smallint
);

CREATE UNIQUE INDEX weapon_pk ON sniperok.weapon USING btree (code);

alter table "sniperok"."weapon" add constraint "weapon_pk" PRIMARY KEY using index "weapon_pk";

create table "sniperok"."weapon_victory" (
    "weapon_code" text not null,
    "versus_code" text not null
);

CREATE UNIQUE INDEX weapon_victory_pk ON sniperok.weapon_victory USING btree (weapon_code, versus_code);
alter table "sniperok"."weapon_victory" add constraint "weapon_victory_pk" PRIMARY KEY using index "weapon_victory_pk";

alter table "sniperok"."weapon_victory" add constraint "weapon_victory_weapon_code_fkey" FOREIGN KEY (weapon_code) REFERENCES sniperok.weapon(code) not valid;
alter table "sniperok"."weapon_victory" add constraint "weapon_victory_versus_code_fkey" FOREIGN KEY (versus_code) REFERENCES sniperok.weapon(code) not valid;

-- ----------------------------------------------------------------------------
--         PLAYER_TURN
-- ----------------------------------------------------------------------------
create table "sniperok"."player_turn" (
    "game_id" bigint not null,
    "round_seq" smallint not null,
    "player_uuid" text not null,
    "weapon_code" text,
    "response_time_millis" smallint
);

CREATE UNIQUE INDEX player_turn_pk ON sniperok.player_turn USING btree (game_id, round_seq, player_uuid);
alter table "sniperok"."player_turn" add constraint "player_turn_pk" PRIMARY KEY using index "player_turn_pk";

alter table "sniperok"."player_turn" add constraint "player_turn_game_id_fkey" FOREIGN KEY (game_id) REFERENCES sniperok.game(id) not valid;
