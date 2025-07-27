import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email' }).min(1, { message: 'Email is required' }),
    password: z.string()
});

export type LoginSchema = typeof loginSchema;
