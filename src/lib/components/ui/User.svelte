<script lang="ts">
    import UserRound from 'lucide-svelte/icons/user-round';

    import { Button } from '$lib/components/ui/button/index.js';

    let { session } = $props();

    let menuOpen = $state(false);

    const menuItems = session
        ? [
              { name: 'Profile', url: '/' },
              { name: 'Logout', url: '/' }
          ]
        : [
              { name: 'Login', url: '/auth/login' },
              { name: 'Register', url: '/auth/register' }
          ];
</script>

<section class="dropdown">
    <Button on:click={() => (menuOpen = !menuOpen)} variant="outline" size="icon">
        <UserRound class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100" />
        <span class="sr-only">User</span>
    </Button>

    <div id="userDropdown" class:show={menuOpen} class="dropdown-content">
        {#each menuItems as item}
            <Button href={item.url} class="justify-start w-1/2">
                <span>{item.name}</span>
            </Button>
            <br />
        {/each}
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
