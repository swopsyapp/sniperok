import { error, json } from '@sveltejs/kit';
import { Transaction } from 'kysely';
import { z } from 'zod';

import { type DB } from '$lib/server/db/junowot-schema.d';
import { db, isCurator } from '$lib/server/db/db.d';

import { logger } from '$lib/logger';
import { StringUtils } from '$lib/StringUtils';
import { HttpStatus } from '$lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    return new Response();
};

export const POST: RequestHandler = async (requestEvent) => {
    const leagueId = StringUtils.trimEndMarkers(requestEvent.params.league_id);

    if (!leagueId) {
        error(HttpStatus.NOT_FOUND, 'League id is mandatory');
    }

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : '';

    const isCurrentUserCurator = await isCurator(leagueId, userId);
    if (!isCurrentUserCurator) {
        error(HttpStatus.FORBIDDEN, 'Not a league curator');
    }

    const rawBody = await requestEvent.request.text();
    logger.trace("rawBody : ", rawBody);

    const newMemberSchema = z.object({
        username: z.string(),
        isCurator: z.boolean().optional().default(false)
    });

    const newMember = newMemberSchema.parse(JSON.parse(rawBody));
    const username = newMember.username.trim();
    
    /*
     * A league must always have at least one curator.
     * Do not allow the last curator (probably self) to be deleted.
     */
    const memberRecord = await db
        .withSchema('junowot')
        .selectFrom('user')
        .where('username', '=', username)
        .select(['id'])
        .executeTakeFirst();

    if ( memberRecord == undefined ) {
        error(HttpStatus.NOT_FOUND, 'User not found');
    }

    await db.withSchema('junowot').transaction().execute(async (trx : Transaction<DB>) => {
        await trx.insertInto('league_member')
            .values({
                league_id: leagueId,
                member_uuid: memberRecord.id ?? '',
                status_code: 'pending',
                is_curator: newMember.isCurator
            })
            .returning('id')
            .executeTakeFirstOrThrow()
    }).then(() => {
        logger.trace(`Added member league(${leagueId}) member(${memberRecord.id})`);
    }).catch(function(err){
        logger.error(`Error deleting league(${leagueId}) member(${memberRecord.id}) - `, err);
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
    });

    return json({ success: true })
};

export const DELETE: RequestHandler = async (requestEvent) => {
    
    logger.trace("requestEvent : ", requestEvent);

    const leagueId = StringUtils.trimEndMarkers(requestEvent.params.league_id);

    if (!leagueId) {
        error(HttpStatus.NOT_FOUND, 'League id is mandatory');
    }

    const memberId = StringUtils.trimEndMarkers(requestEvent.params.member_id);
    if (!memberId) {
        error(HttpStatus.NOT_FOUND, 'Member id is mandatory');
    }

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : '';

    const isCurrentUserCurator = await isCurator(leagueId, userId);
    if (!isCurrentUserCurator) {
        error(HttpStatus.FORBIDDEN, 'Not a league curator');
    }

    /*
     * A league must always have at least one curator.
     * Do not allow the last curator (probably self) to be deleted.
     */
    const curatorCount = await db
        .withSchema('junowot')
        .selectFrom('league_member as lm')
        .where('lm.league_id', '=', leagueId)
        .where('lm.is_curator', '=', true)
        .select(({ fn }) => [fn.count<number>('lm.member_uuid').as('member_count')])
        .executeTakeFirstOrThrow();
    
    logger.trace('curatorCount : ', curatorCount);

    if (curatorCount.member_count == 1) {
        const msg = 'League must have at least one curator';
        logger.warn(msg);
        return error(HttpStatus.NOT_ACCEPTABLE, msg);
    };
    
    logger.trace("About to delete league member : ", memberId);

    await db.withSchema('junowot').transaction().execute(async (trx : Transaction<DB>) => {
        await trx.deleteFrom('league_member as lm')
                .where('lm.league_id', '=', leagueId)
                .where('lm.id', '=', memberId)
                .execute();
    }).then(() => {
        logger.trace(`Deleted league(${leagueId}) member(${memberId})`);
    }).catch(function(err){
        logger.error(`Error deleting league(${leagueId}) member(${memberId}) - `, err);
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
    });

    return json({ success: true })
};
