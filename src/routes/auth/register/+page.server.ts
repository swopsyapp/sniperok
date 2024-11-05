import type { PageServerLoad } from "./$types.js";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { registerSchema } from './RegisterSchema';

import { fail, redirect } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { StringUtils } from '$lib/StringUtils.js';

export const load: PageServerLoad = async () => {   
    return {
        form: await superValidate(zod(registerSchema))
    };
};

/** @satisfies {import('./$types').Actions} */
export const actions = {
    default: async (event) => {
        const formdata = await event.request.formData();
        const email = StringUtils.trimField(formdata, 'email');
        const password = StringUtils.trimField(formdata, 'password');
        const username = StringUtils.trimField(formdata, 'username');
        const forename = StringUtils.trimField(formdata, 'forename');
        const surname = StringUtils.trimField(formdata, 'surname');
        const birthday = StringUtils.trimField(formdata, 'birthday');

        if (!email) {
            console.log('email required');
            return fail(400, { email, emailRequired: true });
        }

        if (!password) {
            console.log('password required');
            return fail(400, { password: null, passwordRequired: true });
        }

        if (!username) {
            console.log('username required');
            return fail(400, { username, usernameRequired: true });
        }

        const supabase: SupabaseClient = event.locals.supabase;
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    forename: forename,
                    surname: surname,
                    birthday: birthday
                }
            }
        });
        console.log('data : ', data);
        console.log('error : ', error);

        redirect(303, '/');

        return { success: true };
    }
};
