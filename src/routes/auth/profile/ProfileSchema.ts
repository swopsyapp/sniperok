import { z } from 'zod';

export const profileSchema = z.object({
    email: z.string().email({ message: 'Invalid email' }).min(1, { message: 'Email is required' }),
    username: z.string().min(4, { message: 'Username must contain at least 4 characters' }),
    name: z.string(),
    surname: z.string(),
    birthday: z.string().date().optional()
});

export type ProfileSchema = typeof profileSchema;
