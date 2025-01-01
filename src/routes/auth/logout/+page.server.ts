import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { supabase } }) => {
    await supabase.auth.signOut();
    return {};
}) satisfies PageServerLoad;