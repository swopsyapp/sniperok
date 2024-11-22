import type { PageServerLoad } from './$types.js';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from './LoginSchema';

import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { redirect as flashRedirect } from 'sveltekit-flash-message/server';
import { logger } from '$lib/logger';

export const load: PageServerLoad = async () => {
    return {
        form: await superValidate(zod(loginSchema))
    };
};

/** @satisfies {import('./$types').Actions} */
export const actions = {
    default: async ({ request, locals, cookies }) => {
        const form = await superValidate(request, zod(loginSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        logger.info('Attempting login for : ', form.data.email);

        const supabase: SupabaseClient = locals.supabase;
        const { data, error } = await supabase.auth.signInWithPassword({
            email: form.data.email,
            password: form.data.password
        });

        if (error == null) {
            logger.trace('Login success for : ', form.data.email);
        } else {
            logger.warn('Error logging in ', form.data.email, error.code, error.message);
            const errorMessage = 'Login error : '.concat(error.message);
            return setError(form, 'email', errorMessage);
        }

        flashRedirect(
            '/',
            { type: 'success', message: `Welcome ${data.user.user_metadata.username}` },
            cookies
        );
    }
};
