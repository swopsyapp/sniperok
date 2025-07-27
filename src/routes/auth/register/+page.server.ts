import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { redirect } from 'sveltekit-flash-message/server';
import type { Server } from 'socket.io';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { db } from '$lib/server/db/db.d';
import { profileSchema } from '$lib/components/ui/profile/ProfileSchema';
import type { Message } from '$lib/components/messages.svelte';
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
            return fail(HttpStatus.BAD_REQUEST, { form });
        }

        if (!form.data.password) {
            const errorMessage = 'Password is mandatory';
            logger.error(errorMessage);
            return setError(form, 'password', errorMessage);
        }

        const usernameCount = await db
            .withSchema('sniperok')
            .selectFrom('user')
            .select(({ fn }) => [fn.count<number>('username').as('tally')])
            .where('username', '=', form.data.username)
            .executeTakeFirstOrThrow();
        if (usernameCount.tally > 0) {
            const errorMessage = 'Username is already registered ';
            logger.info(errorMessage, form.data.username);
            return setError(form, 'username', errorMessage);
        }

        const emailCount = await db
            .withSchema('sniperok')
            .selectFrom('user')
            .select(({ fn }) => [fn.count<number>('username').as('tally')])
            .where('email', '=', form.data.email)
            .executeTakeFirstOrThrow();
        if (emailCount.tally > 0) {
            const errorMessage = 'Email address is already registered ';
            logger.info(errorMessage, form.data.email);
            return setError(form, 'email', errorMessage);
        }

        logger.trace('About to save registration for : ', form.data.email);

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
            logger.error(
                'Error saving registration for ',
                form.data.email,
                error.code,
                error.message
            );
            const errorMessage =
                error.code == 'user_already_exists'
                    ? 'Email already registered.'
                    : 'Registration error';
            return setError(form, 'email', errorMessage);
        }

        const welcomeMsg = {} as Message;
        welcomeMsg.type = 'welcome';
        welcomeMsg.sender = 'rps';
        welcomeMsg.text = `Welcome @${form.data.username}`;

        const io: Server = globalThis.io;
        io.emit('worldChat', welcomeMsg);
        redirect(
            '/auth/login',
            { type: 'success', message: 'Registration was successful, please login' },
            cookies
        );
    }
};
