<script lang="ts">
    import Icon from '@iconify/svelte';

    import { Button } from '$lib/components/ui/button/index.js';
    import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';

    let { session } = $props();

    let menuOpen = $state(false);

    const menuItems = session
        ? [
              { name: 'Profile', url: '/', icon: 'lucide:user-round' },
              { name: 'Logout', url: '/auth/logout', icon: 'mdi:logout' }
          ]
        : [
              { name: 'Login', url: '/auth/login', icon: 'mdi:login' },
              { name: 'Register', url: '/auth/register', icon: 'mdi:register-outline' }
          ];
</script>

<section class="dropdown">
    <Button onclick={() => (menuOpen = !menuOpen)} variant="outline" size="icon">
        <Icon icon="lucide:user-round" class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100" />
        <span class="sr-only">User</span>
    </Button>

    <div id="userDropdown" class:show={menuOpen} class="dropdown-content">
        {#each menuItems as item}
            <Button href={item.url} onclick={() => (menuOpen = !menuOpen)} class="w-1/2 justify-start">
                {#if item.icon != null}
                    <Icon
                        icon={item.icon}
                        class="h-5 w-5 transition-all duration-300 md:group-hover/loginButton:translate-x-1"
                    />
                {/if}
                <span class="pl-1">{item.name}</span>
            </Button>
            <br />
        {/each}
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
