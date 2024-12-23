/**
 * This file was generated by kysely-codegen.
 * Please do not edit it manually.
 */

import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Game {
  id: Generated<Int8>;
  is_public: Generated<boolean>;
  min_players: Generated<number>;
  rounds: Generated<number>;
  start_time: Timestamp;
  status_id: Generated<number>;
}

export interface GamePlayer {
  game_id: Int8;
  player_uuid: string;
  status_id: Generated<number>;
}

export interface PlayerTurn {
  game_id: Int8;
  player_uuid: string;
  response_time_millis: number | null;
  round_seq: number;
  weapon_code: string | null;
}

export interface Status {
  code: string;
  id: Generated<number>;
}

export interface User {
  email: string | null;
  id: string | null;
  username: string | null;
}

export interface Weapon {
  code: string;
  level: Generated<number>;
}

export interface WeaponVictory {
  versus_code: string;
  weapon_code: string;
}

export interface DB {
  game: Game;
  game_player: GamePlayer;
  player_turn: PlayerTurn;
  status: Status;
  user: User;
  weapon: Weapon;
  weapon_victory: WeaponVictory;
}
