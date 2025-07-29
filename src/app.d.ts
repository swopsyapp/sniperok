import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { DB } from '$lib/db/db.d';

declare global {
    namespace App {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface Error {}
        interface Locals {
            supabase: SupabaseClient;
            db: DB;
            safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
            session: Session | null;
            user: User | null;
        }
        interface PageData {
            session: Session | null;
            flash?: { type: 'success' | 'error'; message: string };
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface PageState {}
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface Platform {}
    }
    var io: import('socket.io').Server;
}

export {};
