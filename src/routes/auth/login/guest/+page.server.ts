import { error } from '@sveltejs/kit';
import { redirect as flashRedirect } from 'sveltekit-flash-message/server';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';

import type { PageServerLoad } from './$types';

export const load = (async () => {
    return {};
}) satisfies PageServerLoad;

/** @satisfies {import('./$types').Actions} */
export const actions = {
    default: async ( { request, locals, cookies }) => {
        // const data = await request.formData();
        const json = await request.json();
        logger.trace('Challenge json : ', json);

        const answer = json.answer;
        logger.debug('Guest login answer : ', answer);

        // TODO : make challenge dynamic
        if ( answer != '5') {
            logger.warn('Challenge incorrect : ', answer);
            error(HttpStatus.BAD_REQUEST, 'Nope!');
        }

        if ( locals.user ) {
            logger.warn('Challenge already logged in : ', locals.user);
            error(HttpStatus.BAD_REQUEST, 'already logged in!');
        }
        
        const { data, error: authError } = await locals.supabase.auth.signInAnonymously();
        if (authError) {
            logger.error('Challenge signIn error : ', authError);
            error(HttpStatus.BAD_REQUEST, 'Error!');
        }
        locals.user = data.user;

        flashRedirect(
            '/',
            { type: 'success', message: `Welcome Guest` },
            cookies
        );
    }
};
