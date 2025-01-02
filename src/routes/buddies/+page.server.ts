import { error } from '@sveltejs/kit';
import { type NotNull, sql, Transaction } from 'kysely';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { db } from '$lib/server/db/db.d'
import { type DB } from '$lib/server/db/sniperok-schema.d';
import { Status, getStatus } from '$lib/model/status.d'

import type { PageServerLoad } from './$types';

async function addBuddy(userId : string, buddyName : string) {

    const buddyRecord = await db
        .withSchema('sniperok')
        .selectFrom('user as b')
        .innerJoin('user as u', (join) => join.on('u.id', '=', userId))
        .select(['u.id as player_uuid', 'b.id as buddy_uuid'
                ,sql<number>`(select count(*) from sniperok.buddy br where br.player_uuid = u.id and br.buddy_uuid = b.id)`.as('buddy_count')
        ])
        .where('b.username', '=', buddyName)
        .$narrowType<{ player_uuid: NotNull }>()
        .$narrowType<{ buddy_uuid: NotNull }>()
        .executeTakeFirst();

    if (!buddyRecord) {
        logger.debug('BuddyRecord not found ', buddyName, ' for ', userId);
        error(HttpStatus.NOT_FOUND, 'Buddy not found');
    }

    if (buddyRecord.buddy_count > 0) {
        logger.debug('BuddyRecord already exists ', buddyName, ' for ', userId);
        error(HttpStatus.CONFLICT, 'Buddy already exists');
    }

    if (buddyRecord.player_uuid == buddyRecord.buddy_uuid) {
        logger.debug('BuddyRecord cannot be created for self ', buddyName, ' for ', userId);
        error(HttpStatus.NOT_ACCEPTABLE, 'Cannot buddy yourself');
    }

    logger.debug(`adding buddy: ${buddyName} for ${userId}`);

    await db.withSchema('sniperok').transaction().execute(async (trx : Transaction<DB>) => {
        await trx.insertInto('buddy')
            .values({
                player_uuid: buddyRecord.player_uuid,
                buddy_uuid: buddyRecord.buddy_uuid,
                status_id: Status.pending.valueOf()
            })
            .execute()
    }).catch(function(err){
        logger.error('Error creating buddy', err);
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
    });

    return;
}

export const load = (async (requestEvent) => {

    const locals = requestEvent.locals;
    const action = requestEvent.url.searchParams.get('action');
    const buddyName = requestEvent.url.searchParams.get('buddyName');

    const { user } = await locals.safeGetSession();

    let addBuddyError = undefined;

    if (action == 'add' && buddyName) {
        const userId = user ? user.id : '';
        
        try {
            await addBuddy(userId, buddyName);
        } catch(e) {
            addBuddyError = e;
            logger.error(e);
        }
    }

    const username = user?.user_metadata.username;
    const buddies = await db
        .withSchema('sniperok')
        .selectFrom('buddy_vw as b')
        .select(['b.player', 'b.buddy', 'b.status_id'
                ,sql`case when b.player = ${username} then b.buddy else b.player end`.as('counterparty')])
        .where((eb) => eb('b.player', '=', username).or('b.buddy', '=', username))
        .orderBy('counterparty asc')
        .$narrowType<{ player: NotNull }>()
        .$narrowType<{ buddy: NotNull }>()
        .execute();
    
    const buddiesList = buddies.map((buddyRecord) => {
        return {
            player: buddyRecord.player,
            buddy: buddyRecord.buddy,
            counterparty: buddyRecord.counterparty,
            status: getStatus(buddyRecord.status_id ?? Status.pending)
        }
    })

    if (addBuddyError) {
        logger.debug(addBuddyError);
    }

    return {
        buddies: buddiesList
    };
}) satisfies PageServerLoad;

/** @satisfies {import('./$types').Actions} */
export const actions = {
    default: async ( { request, locals }) => {
        const jsonBody = await request.json();
        logger.trace('New buddy : ', jsonBody);

        const buddyName : string = jsonBody.buddyName;

        // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
        const { user } = await locals.safeGetSession();
        const userId = user ? user.id : '';

        await addBuddy(userId, buddyName);
    
        return { success: true };
    }
};
