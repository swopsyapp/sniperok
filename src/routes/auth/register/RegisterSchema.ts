import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email({ message: 'Invalid email' }).min(1, { message: 'Email is required' }),
    password: z.string().min(8, { message: 'Password must contain at least 8 characters' }),
    username: z.string().min(4, { message: 'Username must contain at least 4 characters' }),
    name: z.string(),
    surname: z.string(),
    birthday: z.string().date().optional()
});

export type RegisterSchema = typeof registerSchema;
