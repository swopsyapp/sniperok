import { db } from '$lib/server/db/db.d';

export const load = async ({ locals }) => {
    const { user } = await locals.safeGetSession();

    let pendingLeagueCount = 0;
    
    if (user) {
        const pendingLeagueDbCount = await db
            .withSchema('junowot')
            .selectFrom('league_member as lm')
            .where('lm.member_uuid', '=', user.id)
            .where('lm.status_code', '=', 'pending')
            .select(({ fn }) => [fn.count<number>('lm.id').as('tally')])
            .executeTakeFirst();
        
        if (pendingLeagueDbCount) {
            pendingLeagueCount = pendingLeagueDbCount.tally;
        }
    }

    return {
        user,
        pendingLeagueCount
    };
};
