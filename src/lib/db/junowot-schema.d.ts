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
  language: Generated<string>;
  name: string;
  owner: Generated<string>;
  round_duration: Generated<number>;
  rounds: Generated<number>;
  updated_at: Generated<Timestamp>;
}

export interface League {
  id: Generated<Int8>;
  name: string;
  owner: Generated<string>;
  updated_at: Generated<Timestamp>;
}

export interface LeagueMember {
  id: Generated<Int8>;
  is_curator: Generated<boolean>;
  league_id: Int8;
  member_uuid: string;
  status_code: Generated<string>;
  updated_at: Generated<Timestamp>;
}

export interface LeagueMemberStatus {
  code: Generated<string>;
}

export interface DB {
  game: Game;
  league: League;
  league_member: LeagueMember;
  league_member_status: LeagueMemberStatus;
}
