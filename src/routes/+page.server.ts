// import { db } from '$lib/server/db/db.d';

export const load = async ({ locals }) => {
    const { user } = await locals.safeGetSession();

    let boostsCount = 0;
    
    if (user && !user.is_anonymous) {
        const boostsDbCount = undefined;
        // const boostsDbCount = await db
        //     .withSchema('sniperok')
        //     .selectFrom('league_member as lm')
        //     .where('lm.member_uuid', '=', user.id)
        //     .where('lm.status_code', '=', 'pending')
        //     .select(({ fn }) => [fn.count<number>('lm.id').as('tally')])
        //     .executeTakeFirst();
        
        if (boostsDbCount) {
            boostsCount = 0;
            // boostsCount = boostsDbCount.tally;
        }
    }

    return {
        user,
        boostsCount
    };
};
