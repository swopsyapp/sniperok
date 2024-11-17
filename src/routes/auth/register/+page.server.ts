import type { PageServerLoad } from './$types.js';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { registerSchema } from './RegisterSchema';

import { fail, redirect } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';

export const load: PageServerLoad = async () => {
    return {
        form: await superValidate(zod(registerSchema))
    };
};

/** @satisfies {import('./$types').Actions} */
export const actions = {
    default: async (event) => {
        const form = await superValidate(event.request, zod(registerSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        console.log('About to save registration for : ', form.data.username);

        const supabase: SupabaseClient = event.locals.supabase;
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

        redirect(303, '/');

        return { form };
    }
};
