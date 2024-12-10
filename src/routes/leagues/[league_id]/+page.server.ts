import { logger } from '$lib/logger';
import { StringUtils } from '$lib/StringUtils';
import { db } from '$lib/server/db/db.d'

import type { PageServerLoad } from './$types';

export const load = (async (requestEvent) => {

    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : ''; // NOTE: user should never be null here due to auth guard hook

    const leagueId = StringUtils.trimEndMarkers(requestEvent.params.league_id);

    logger.trace('loading league : ', leagueId);

    const league = await db
        .withSchema('junowot')
        .selectFrom('league as l')
        .innerJoin('league_member as lm', 'lm.league_id', 'l.id')
        .select([
            'l.id', 'l.name', 'lm.is_curator'
        ])
        .where('l.id', '=', leagueId)
        .where('lm.member_uuid', '=', userId)
        .executeTakeFirstOrThrow();
    
    const members = await db
        .withSchema('junowot')
        .selectFrom('league_member as lm')
        .innerJoin('user as u', 'u.id', 'lm.member_uuid')
        .select([
            'lm.id as league_member_id', 'u.username', 'lm.status_code', 'lm.is_curator'
        ])
        .where('lm.league_id', '=', league.id)
        .execute();

    /*
    league_id: string;
    id: string;
    updated_at: Date;
    is_curator: boolean;
    member_uuid: string;
    status_code: string;
    */

    return {
        league: {
            id: league.id,
            name: league.name,
            currentUser: {
                isCurator: league.is_curator
            },
            members: members
        }
    };
}) satisfies PageServerLoad;