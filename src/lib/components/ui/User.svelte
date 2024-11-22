<script lang="ts">
    import { page } from '$app/stores';
    import Icon from '@iconify/svelte';

    import { logger } from '$lib/logger';
    import { Button } from '$lib/components/ui/button/index.js';
    import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
    
    let menuOpen = $state(false);
    let user = $page.data.user;

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
    <Button onclick={() => (menuOpen = !menuOpen)} variant="outline" size="icon">
        <Icon icon="lucide:user-round" class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100" />
        <span class="sr-only">User</span>
    </Button>

    <div id="userDropdown" class:show={menuOpen} class="dropdown-content">
        {#if !user}
            {@render menuItem('Login', '/auth/login', 'mdi:login')}
            {@render menuItem('Register', '/auth/register', 'mdi:register-outline')}
        {:else}
            {@render menuItem('Profile', '/', 'lucide:user-round')}
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
