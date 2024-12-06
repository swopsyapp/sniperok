create schema if not exists "junowot";

create table "junowot"."game" (
    "id" bigint generated by default as identity not null,
    "name" character varying not null,
    "language" character varying not null default '''en'''::character varying,
    "is_public" boolean not null default false,
    "rounds" smallint not null default '3'::smallint,
    "round_duration" smallint not null default '60'::smallint,
    "league_id" bigint not null,
    "updated_at" timestamp with time zone not null default now()
);

alter table "junowot"."game" enable row level security;

CREATE UNIQUE INDEX game_pkey1 ON junowot.game USING btree (id);

alter table "junowot"."game" add constraint "game_pkey1" PRIMARY KEY using index "game_pkey1";
