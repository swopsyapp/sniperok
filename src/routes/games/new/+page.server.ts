import { error } from '@sveltejs/kit';
import { redirect as flashRedirect } from 'sveltekit-flash-message/server';
import { Transaction } from 'kysely';

import { db } from '$lib/server/db/db.d';
import { type DB } from '$lib/server/db/sniperok-schema.d';
import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { Status } from '$lib/model/model.d';

/**
 * POST : Create Game
 * @satisfies {import('./$types').Actions}
 */
export const actions = {
    default: async ( { request, locals, cookies }) => {
        // const data = await request.formData();
        const json = await request.json();
        logger.trace('New game : ', json);

        const isPublic : boolean = json.isPublic;
        const minPlayers : number = json.minPlayers;
        const startSeconds : number = json.startSeconds;
        const startTime : Date = new Date();
        startTime.setSeconds(startTime.getSeconds() + startSeconds);

        // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
        const { user } = await locals.safeGetSession();
        const userId = user ? user.id : '';

        await db.withSchema('sniperok').transaction().execute(async (trx : Transaction<DB>) => {
            const game = await trx.insertInto('game')
                .values({
                    status_id: Status.pending.valueOf(),
                    is_public: isPublic,
                    min_players: minPlayers,
                    start_time: startTime
                })
                .returning('id')
                .executeTakeFirstOrThrow()

                await trx.insertInto('game_player')
                .values({
                    game_id: game.id,
                    player_uuid: userId,
                    status_id: Status.activeCurator.valueOf()
                })
                .returningAll()
                .executeTakeFirst()

        }).catch(function(err){
            logger.error('Error creating game', err);
            error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
        });
    
        // return json({ success: true })

        flashRedirect(
            '/games',
            { type: 'success', message: 'Game created' },
            cookies
        );
    }
};
