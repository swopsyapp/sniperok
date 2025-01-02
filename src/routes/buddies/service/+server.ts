import { error, json } from '@sveltejs/kit';
import { Transaction } from 'kysely';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { db } from '$lib/server/db/db.d'
import { type DB } from '$lib/server/db/sniperok-schema.d';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ request, locals }) => {
    const jsonBody = await request.json();
    logger.trace('Delete buddy : ', jsonBody);

    const playerName : string = jsonBody.playerName;
    const buddyName : string = jsonBody.buddyName;

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await locals.safeGetSession();
    const username = user ? user.user_metadata.username : '';

    if (username != playerName && username != buddyName) {
        logger.warn('Unauthorized buddy deletion ', buddyName, ' for ', playerName, ' as ', username);
        error(HttpStatus.FORBIDDEN, 'Unauthorized');
    }

    const buddyRecord = await db
        .withSchema('sniperok')
        .selectFrom('buddy_vw as b')
        .innerJoin('user as pu', 'pu.username', 'b.player')
        .innerJoin('user as bu', 'bu.username', 'b.buddy')
        .select(['pu.id as player_uuid', 'bu.id as buddy_uuid'])
        .where('b.player', '=', playerName)
        .where('b.buddy', '=', buddyName)
        .executeTakeFirst();

    if (!buddyRecord) {
        logger.debug('BuddyRecord not found ', buddyName, ' for ', playerName);
        error(HttpStatus.NOT_FOUND, 'Buddy not found');
    }

    logger.debug(`Deleting buddy: ${buddyName} for ${playerName}`);

    await db.withSchema('sniperok').transaction().execute(async (trx : Transaction<DB>) => {
        await trx.deleteFrom('buddy as b')
                .where('b.player_uuid', '=', buddyRecord.player_uuid)
                .where('b.buddy_uuid', '=', buddyRecord.buddy_uuid)
                .execute();
    }).catch(function(err){
        logger.error(`Error deleting buddy : ${playerName} + ${buddyName} `, err);
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
    });

    return json({ success: true });
};