import { error, json } from '@sveltejs/kit';
import { Transaction } from 'kysely';
import { z } from 'zod';

import { type DB } from '$lib/server/db/junowot-schema.d';
import { db, isCurator } from '$lib/server/db/db.d';

import { logger } from '$lib/logger';
import { StringUtils } from '$lib/StringUtils';
import { HttpStatus } from '$lib/utils';
import type { RequestHandler } from './$types';

/**
 * POST : Adds a new league member with status pending
 * DELETE : Removes the league member
 * PATCH : Update the membership status or curator flag
 */

async function getLeagueMember(memberId : string) {
    const leagueMemberRecord = await db
        .withSchema('junowot')
        .selectFrom('league_member')
        .where('id', '=', memberId)
        .selectAll()
        .executeTakeFirst();
    
    return leagueMemberRecord;
}

/**
 * Adds a new league member with status pending
 * @param requestEvent 
 * @returns 
 */
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
    const userRecord = await db
        .withSchema('junowot')
        .selectFrom('user')
        .where('username', '=', username)
        .select(['id'])
        .executeTakeFirst();

    if ( userRecord == undefined ) {
        error(HttpStatus.NOT_FOUND, 'User not found');
    }

    await db.withSchema('junowot').transaction().execute(async (trx : Transaction<DB>) => {
        await trx.insertInto('league_member')
            .values({
                league_id: leagueId,
                member_uuid: userRecord.id ?? '',
                status_code: 'pending',
                is_curator: newMember.isCurator
            })
            .returning('id')
            .executeTakeFirstOrThrow()
    }).then(() => {
        logger.trace(`Added member league(${leagueId}) member(${userRecord.id})`);
    }).catch(function(err){
        logger.error(`Error deleting league(${leagueId}) member(${userRecord.id}) - `, err);
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

    /*
     * A league must always have at least one curator.
     * Do not allow the last curator (probably self) to be deleted.
     */
    const memberRecord = await getLeagueMember(memberId);

    if ( memberRecord == undefined ) {
        error(HttpStatus.NOT_FOUND, 'Member not found');
    }

    if ( userId == memberRecord.member_uuid ) {
        // TODO also fix this with row level security on postgres
        logger.trace('OK for user to remove own record');
    } else {
        // If member != self then self must be curator in order to update member record
        const isCurrentUserCurator = await isCurator(leagueId, userId);
        if (!isCurrentUserCurator) {
            error(HttpStatus.FORBIDDEN, 'Not a league curator');
        }    
    }

    if ( memberRecord.is_curator ) {
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
    }
    
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

/**
 * Update the membership status or curator flag
 * @param requestEvent 
 * @returns 
 */
export const PATCH: RequestHandler = async (requestEvent) => {
    const leagueId = StringUtils.trimEndMarkers(requestEvent.params.league_id);
    const memberId = StringUtils.trimEndMarkers(requestEvent.params.member_id);

    if (!leagueId) {
        error(HttpStatus.NOT_FOUND, 'League id is mandatory');
    }

    if (!memberId) {
        error(HttpStatus.NOT_FOUND, 'Member id is mandatory');
    }

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : '';

    const rawBody = await requestEvent.request.text();
    logger.trace("rawBody : ", rawBody);

    const memberPatchSchema = z.object({
        leagueId: z.string(),
        memberId: z.string(),
        statusCode: z.string().optional(),
        isCurator: z.boolean().optional()
    });

    const memberPatch = memberPatchSchema.parse(JSON.parse(rawBody));

    /*
     * A league must always have at least one curator.
     * Do not allow the last curator (probably self) to be deleted.
     */
    const memberRecord = await getLeagueMember(memberId);

    if ( memberRecord == undefined ) {
        error(HttpStatus.NOT_FOUND, 'Member not found');
    }

    if ( userId == memberRecord.member_uuid ) {
        // TODO also fix this with row level security on postgres
        logger.trace('OK for user to update own record');
    } else {
        // If member != self then self must be curator in order to update member record
        const isCurrentUserCurator = await isCurator(leagueId, userId);
        if (!isCurrentUserCurator) {
            error(HttpStatus.FORBIDDEN, 'Not a league curator');
        }    
    }

    logger.trace('memberPatch', memberPatch);
    
    if ( !Object.keys(memberPatch).includes("statusCode") ) {
        memberPatch.statusCode = memberRecord.status_code;
    }

    if ( !Object.keys(memberPatch).includes("isCurator") ) {
        memberPatch.isCurator = memberRecord.is_curator;
    }

    await db.withSchema('junowot').transaction().execute(async (trx : Transaction<DB>) => {
        await trx.updateTable('league_member as lm')
                .set({
                    status_code: memberPatch.statusCode,
                    is_curator: memberPatch.isCurator
                })
                .where('lm.id', '=', memberRecord.id)
                .execute();
    }).then(() => {
        logger.trace("Updated league_member : ", memberRecord.id);
    }).catch(function(err){
        logger.error(`Error updating league_member : ${memberRecord.id} - `, err);
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
    });

    return json({ success: true })
};
