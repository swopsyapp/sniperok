import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { redirect } from 'sveltekit-flash-message/server'

import { logger } from '$lib/logger';
import { profileSchema } from '$lib/components/ui/profile/ProfileSchema';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async (requestEvent) => {

    const { session, user } = await requestEvent.locals.safeGetSession();

    if (!user) {
        logger.error('User not logged in.');
        redirect('/', { type: 'error', message: 'You are not logged in' }, requestEvent);
    }

    const form = await superValidate(zod(profileSchema));
    form.data.profileMode = 'update';

    if (!form.data.email) {
        form.data.email = user.email ?? '';
        const userMeta = session?.user.user_metadata;
        form.data.username = userMeta?.username;
        form.data.name = userMeta?.name;
        form.data.surname = userMeta?.surname;
        form.data.birthday = userMeta?.birthday;
    }

    logger.trace('form : ', form);

    return {
        form
    };
};

/** @satisfies {import('./$types').Actions} */
export const actions = {
    default: async ({ request, locals, cookies }) => {
        const form = await superValidate(request, zod(profileSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        console.log('About to update profile for : ', form.data.email);

        const supabase: SupabaseClient = locals.supabase;
        const { error } = await supabase.auth.updateUser({
            data: {
                username: form.data.username,
                name: form.data.name,
                surname: form.data.surname,
                birthday: form.data.birthday
            }
        });

        if (error != null) {
            console.log('Error saving profile for ', form.data.email, error.code, error.message);
            const errorMessage = 'Profile update error : '.concat(error.message);
            return setError(form, 'email', errorMessage);
        }

        redirect('/', { type: 'success', message: "Profile update was successful" }, cookies);
    }
};
