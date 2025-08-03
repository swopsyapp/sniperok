import { db } from '$lib/server/db/db.d';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    const { user } = await locals.safeGetSession();
    const userId = user ? user.id : null;

    if (!userId) {
        return {
            boosts: []
        };
    }

    const userBoosts = await db
        .withSchema('sniperok')
        .selectFrom('user_boost_vw')
        .selectAll()
        .where('user_uuid', '=', userId)
        .orderBy('period desc')
        .execute();

    const boostsList = userBoosts.map((boost) => {
        return {
            boostType: boost.boost_type_code,
            icon: boost.icon,
            period: boost.period,
            quantity: boost.quantity
        };
    });

    return {
        boosts: boostsList
    };
}) satisfies PageServerLoad;
