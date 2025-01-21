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

export interface Buddy {
  buddy_uuid: string;
  player_uuid: string;
  status_id: Generated<number>;
}

export interface BuddyVw {
  buddy: string | null;
  player: string | null;
  status_code: string | null;
  status_id: number | null;
}

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
  player_seq: Generated<number>;
  player_uuid: string;
  status_id: Generated<number>;
}

export interface GameRound {
  game_id: Int8;
  round_seq: number;
  status_id: Generated<number>;
}

export interface PlayerTurn {
  game_id: Int8;
  player_uuid: string;
  response_time_millis: number;
  round_seq: number;
  weapon_code: string;
}

export interface Status {
  code: string;
  id: Generated<number>;
}

export interface User {
  created_at: Timestamp | null;
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
  buddy: Buddy;
  buddy_vw: BuddyVw;
  game: Game;
  game_player: GamePlayer;
  game_round: GameRound;
  player_turn: PlayerTurn;
  status: Status;
  user: User;
  weapon: Weapon;
  weapon_victory: WeaponVictory;
}
