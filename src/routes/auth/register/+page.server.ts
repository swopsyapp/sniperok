import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { redirect } from 'sveltekit-flash-message/server'

import { logger } from '$lib/logger';
import { profileSchema } from '$lib/components/ui/profile/ProfileSchema';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
    const form = await superValidate(zod(profileSchema));
    form.data.profileMode = 'create';

    logger.trace('form : ', form);
    
    return { form };
};

/** @satisfies {import('./$types').Actions} */
export const actions = {
    default: async ({ request, locals, cookies }) => {
        const form = await superValidate(request, zod(profileSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        if (!form.data.password) {
            const errorMessage = 'Password is mandatory';
            logger.error(errorMessage);
            return setError(form, 'password', errorMessage);
        }

        console.log('About to save registration for : ', form.data.email);

        const supabase: SupabaseClient = locals.supabase;
        const { error } = await supabase.auth.signUp({
            email: form.data.email,
            password: form.data.password,
            options: {
                data: {
                    username: form.data.username,
                    name: form.data.name,
                    surname: form.data.surname,
                    birthday: form.data.birthday
                }
            }
        });

        if (error != null) {
            console.log('Error saving registration for ', form.data.email, error.code, error.message);
            const errorMessage = (error.code == 'user_already_exists') ? 'Email already registered.' : 'Registration error : '.concat(error.message);
            return setError(form, 'email', errorMessage);
        }

        redirect('/auth/login', { type: 'success', message: "Registration was successful, please login" }, cookies);
    }
};
