<script lang="ts">
    import Icon from '@iconify/svelte';
    import type { User } from '@supabase/supabase-js';

    import { page } from '$app/stores';
    import { logger } from '$lib/logger';

    import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
    import * as Tooltip from '$lib/components/ui/tooltip/index.js';
    import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';

    let menuOpen = $state(false);
    let user : User = $page.data.user;
    const username = !user ? 'Visitor' : user.is_anonymous ? 'Ghost' : user.user_metadata.username;
    const userIcon = username == 'Visitor' ? 'mdi:anonymous' : username == 'Ghost' ? 'mdi:ghost-outline' : 'lucide:user-round';

    logger.trace(`User.svelte $page : `, JSON.stringify(Object.keys($page)));
    logger.trace(`User.svelte $page.data : `, JSON.stringify(Object.keys($page.data)));
    logger.trace(`User.svelte $page.data.user : `, JSON.stringify($page.data.user));
</script>

{#snippet menuItem(name: string, url: string, icon: string)}
    <Button href={url} onclick={() => (menuOpen = !menuOpen)} class="w-1/2 justify-start">
        {#if icon != null}
            <Icon
                {icon}
                class="h-5 w-5 transition-all duration-300 md:group-hover/loginButton:translate-x-1"
            />
        {/if}
        <span class="pl-1">{name}</span>
    </Button>
    <br />
{/snippet}

<section class="dropdown">
    <Tooltip.Provider>
        <Tooltip.Root>
            <Tooltip.Trigger onclick={() => (menuOpen = !menuOpen)} class={buttonVariants({variant: 'outline', size: 'icon'})} >
                <Icon icon={userIcon} class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100" />
                <span class="sr-only">User</span>
            </Tooltip.Trigger>
            <Tooltip.Content>
                <p>{username}</p>
            </Tooltip.Content>
        </Tooltip.Root>
    </Tooltip.Provider>

    <div id="userDropdown" class:show={menuOpen} class="dropdown-content">
        {#if !user}
            {@render menuItem('Login', '/auth/login', 'mdi:login')}
            {@render menuItem('Register', '/auth/register', 'mdi:register-outline')}
            {@render menuItem('Guest', '/auth/login/guest', 'mdi:ghost-outline')}
        {:else}
            {#if !user.is_anonymous}
                {@render menuItem('Profile', '/auth/profile', 'lucide:user-round')}
            {/if}
            {@render menuItem('Logout', '/auth/logout', 'mdi:logout')}
        {/if}
        <ThemeToggle />
    </div>
</section>

<style>
    .dropdown {
        position: relative;
        display: inline-block;
    }

    .dropdown-content {
        display: none;
        position: absolute;
        min-width: 230px;
        z-index: 1;
    }

    /* Show the dropdown menu */
    .show {
        display: block;
    }
</style>
