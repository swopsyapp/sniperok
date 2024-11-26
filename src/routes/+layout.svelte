<script lang="ts">
    import '../app.css';
    import { goto, invalidate } from '$app/navigation';
    import { ModeWatcher } from 'mode-watcher';
    import User from '$lib/components/ui/User.svelte';
    import Icon from '@iconify/svelte';
    import { getFlash } from 'sveltekit-flash-message';
    import { page } from '$app/stores';
    import { logger } from '$lib/logger';

    /*
        State management issues see:
            https://github.com/sveltejs/kit/issues/4941
            https://github.com/sveltejs/kit/issues/4941#issuecomment-1227758791
            https://github.com/sveltejs/kit/discussions/5007
            
    */

    const { data, children } = $props();
    let session = $state(data.session);
    let user = $state(data.user);

    const { supabase } = data;

    const flash = getFlash(page);

    logger.trace('user.email : ', user?.email ?? null);

    $effect(() => {
        const { data: authData } = supabase.auth.onAuthStateChange((event, newSession) => {
            logger.trace(`eff: running layout effect ${event} ${newSession}`);
            logger.trace(`eff: session.user.is_anon : ${newSession?.user.is_anonymous}`);
            logger.trace(`eff: session.user.email : ${newSession?.user.email}`);

            if (!newSession) {
                logger.trace(`Triggering goto root for missing session`);
                /**
                 * Queue this as a task so the navigation won't prevent the
                 * triggering function from completing
                 */
                setTimeout(() => {
                    goto('/', { invalidateAll: true });
                });
            }
            if (newSession?.expires_at !== session?.expires_at) {
                invalidate('supabase:auth');
            }
        });

        return () => authData.subscription.unsubscribe();
    });
</script>

<ModeWatcher />

<div class="flex min-h-screen flex-col">
    <nav class="border-b p-2">
        <div class="mx-auto flex w-full max-w-2xl items-center justify-between">
            <a href="/" class="text-2xl font-bold">Junowot</a>

            <div class="flex items-center justify-center gap-2">
                <Icon icon="mdi:list-status" class="h-16 w-16 text-sky-400" />
                <div>|</div>
                <Icon icon="mdi:list-status" class="h-16 w-16 text-emerald-400" />
                <div>|</div>
                <Icon icon="mdi:list-status" class="h-16 w-16 text-yellow-400" />
                <div>|</div>
                <Icon icon="mdi:list-status" class="h-16 w-16 text-pink-500" />
                <div>|</div>
                <Icon icon="mdi:list-status" class="h-16 w-16 text-rose-700" />
            </div>

            <div class="flex gap-2">
                {#key $page.url.pathname}
                    <User />
                {/key}
            </div>
        </div>
    </nav>

    <main class="mx-auto w-full max-w-2xl flex-grow px-2 py-5 md:px-0">
        {#if $flash}
            {@const flashClass = 'rounded-lg border shadow-sm text-center mx-auto max-w-md h-10 pt-2 '.concat(
                $flash.type == 'success' ? 'bg-emerald-400' : 'bg-rose-600'
            )}
            <div class="pb-1">
                <div class={flashClass}>
                    <div><span class="pl-1">{$flash.message}</span></div>
                </div>
            </div>
        {/if}
        {@render children()}
    </main>

    <footer class="w-full border-t py-5">
        <div class="mx-auto flex w-full max-w-2xl items-center justify-center">
            <a href="https://github.com/swopsyapp" class="text-sm">Swopsy</a>
        </div>
    </footer>
</div>

<style>
    html,
    body {
        height: 100%;
        margin: 0;
        padding: 0;
    }
</style>
