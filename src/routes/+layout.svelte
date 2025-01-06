<script lang="ts">
    import Icon from '@iconify/svelte';
    import { ModeWatcher } from 'mode-watcher';
    import { getFlash } from 'sveltekit-flash-message';

    import { page } from '$app/stores';
    import { goto, invalidate } from '$app/navigation';

    import User from '$lib/components/ui/User.svelte';
    import MessagePanel from '$lib/components/MessagePanel.svelte';
    import { logger } from '$lib/logger';
    import '../app.css';

    /*
        State management issues see:
            https://github.com/sveltejs/kit/issues/4941
            https://github.com/sveltejs/kit/issues/4941#issuecomment-1227758791
            https://github.com/sveltejs/kit/discussions/5007
            
    */

    const { data, children } = $props();
    let session = $state(data.session);

    const { supabase } = data;

    const flash = getFlash(page);

    $effect(() => {
        const { data: authData } = supabase.auth.onAuthStateChange((event, newSession) => {
            logger.debug(`eff: running layout effect ${event} ${newSession}`);

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
            <a href="/" class="text-2xl font-bold italic">rps-2.0!</a>

            <div class="flex items-center justify-center gap-8">
                <a href="/"><Icon icon="fa:hand-rock-o" class="h-16 w-16 text-red-600" /></a>
                <div>|</div>
                <a href="/"><Icon icon="fa:hand-paper-o" class="h-16 w-16 text-yellow-400" /></a>
                <div>|</div>
                <a href="/"><Icon icon="fa:hand-scissors-o" class="h-16 w-16 text-blue-500" /></a>
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
            {@const flashClass =
                'rounded-lg border shadow-sm text-center mx-auto max-w-md h-10 pt-2 '.concat(
                    $flash.type == 'success' ? 'bg-emerald-400' : 'bg-rose-600'
                )}
            <div class="pb-1">
                <div class={flashClass}>
                    <div><span class="pl-1">{$flash.message}</span></div>
                </div>
            </div>
        {/if}
        <div class="grid auto-rows-fr grid-cols-3 gap-1">
            <div class="col-span-2">
                {@render children()}
            </div>
            <div>
                {#key $page.url.pathname}
                    <MessagePanel />
                {/key}
            </div>
        </div>
    </main>

    <footer class="w-full border-t py-5">
        <div class="mx-auto flex w-full max-w-2xl items-center justify-center">
            <a href="https://github.com/swopsyapp" class="text-sm">Swopsy</a>
        </div>
    </footer>
</div>

<style>
</style>
