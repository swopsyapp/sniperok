import type { SupabaseClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';

// import * as db from '$lib/server/db';

// /** @type {import('./$types').PageServerLoad} */
// export async function load({ cookies }) {
//     const user = await db.getUserFromSession(cookies.get('sessionid'));
//     return { user };
// }

/** @satisfies {import('./$types').Actions} */
export const actions = {
    // login: async ({ cookies, request }) => {
    //     const data = await request.formData();
    //     const email = data.get('email');
    //     const password = data.get('password');

    //     const user = await db.getUser(email);
    //     cookies.set('sessionid', await db.createSession(user), { path: '/' });

    //     return { success: true };
    // },
    register: async (event: RequestEvent) => {
        // const {
        //     url,
        //     locals: { supabase },
        //   } = event;
        const supabase: SupabaseClient = event.locals.supabase;
        const { data, error } = await supabase.auth.signUp({
            email: 'example@email.com',
            password: 'example-password'
        });
        console.log('data : ', data);
        console.log('error : ', error);
    }
};
