import { getUserBoosts } from '$lib/server/db/gameRepository.d';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    const { user } = await locals.safeGetSession();
    const userId = user ? user.id : null;

    if (!userId) {
        return {
            boosts: []
        };
    }

    const userBoosts = await getUserBoosts(userId);

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
