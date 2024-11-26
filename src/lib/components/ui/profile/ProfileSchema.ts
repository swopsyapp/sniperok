import { z } from 'zod';

/*
 * This is a bad pattern to follow, but leaving it here as a reference - don't copy this.
 * The trade-off is higher complexity vs more boiler plate.
 * In future rather go for lower complexity, and accept overlapping schemas
 * rather than using complicated unions.
 */

const registeredSchema = z.object({
    profileMode: z.literal('update'),
    email: z.string().email({ message: 'Invalid email' }).min(1, { message: 'Email is required' }),
    password: z.string().optional(),
    username: z.string().min(4, { message: 'Username must contain at least 4 characters' }),
    name: z.string().optional(),
    surname: z.string().optional(),
    birthday: z.string().date().optional()
});

const unregisteredSchema = z.object({
    profileMode: z.literal('create'),
    email: z.string().email({ message: 'Invalid email' }).min(1, { message: 'Email is required' }),
    password: z.string().min(8, { message: 'Password must contain at least 8 characters' }),
    username: z.string().min(4, { message: 'Username must contain at least 4 characters' }),
    name: z.string().optional(),
    surname: z.string().optional(),
    birthday: z.string().date().optional()
});

export const profileSchema = z.discriminatedUnion('profileMode', [
    registeredSchema,
    unregisteredSchema
]);

export type ProfileSchema = typeof profileSchema;
