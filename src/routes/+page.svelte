<script lang="ts">
    import type { User } from '@supabase/supabase-js';
    import Icon from '@iconify/svelte';

    import { page } from '$app/stores';
    import * as Card from '$lib/components/ui/card/index';
    import { Button } from '$lib/components/ui/button';

    //  let { user, pendingLeagueCount } = $props();
    // Wierd that user props doesn't behave properly
    let user: User = $page.data.user;
    const isRegisteredUserSession: boolean = user && !user.is_anonymous ? true : false;

    const boostsCount: number = parseInt($page.data.boostsCount);

    const btnIconClass = 'h-5 w-5 ';
    const itemCountClass = 'pl-1 text-green-500';
</script>

{#snippet pageActionButton(
    href: string,
    iconName: string,
    iconColor: string,
    buttonLabel: string,
    isDisabled: boolean,
    itemCount: number = 0
)}
    {#if isDisabled}
        <Button disabled={true} class="w-full">
            <div class="flex items-center gap-2">
                <Icon icon={iconName} class={btnIconClass + iconColor} />
                <span>{buttonLabel}</span>
                {#if itemCount > 0}
                    <span class={itemCountClass}>
                        [{itemCount}]
                    </span>
                {/if}
            </div>
        </Button>
    {:else}
        <Button {href} class="w-full">
            <div class="flex items-center gap-2">
                <Icon icon={iconName} class={btnIconClass + iconColor} />
                {buttonLabel}
                {#if itemCount > 0}
                    <span class={itemCountClass}>
                        [{itemCount}]
                    </span>
                {/if}
            </div>
        </Button>
    {/if}
    <br />
    <br />
{/snippet}

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-4xl font-thin"
                >Welcome to <i>rps-2.0!</i></Card.Title
            >
            <!-- <Card.Description>Welcome</Card.Description> -->
        </Card.Header>
        <Card.Content>
            {@render pageActionButton(
                '/games',
                'mdi:format-list-checkbox',
                'text-yellow-400',
                'List Games',
                false
            )}
            {@render pageActionButton(
                '/games/new',
                'mdi:add-bold',
                'text-green-600',
                'Create game',
                !isRegisteredUserSession
            )}
            {@render pageActionButton(
                '/boosts',
                'mdi:rocket-launch-outline',
                'text-blue-500',
                'Boosts',
                !isRegisteredUserSession,
                boostsCount
            )}
            {@render pageActionButton(
                '/buddies',
                'mdi:account-group-outline',
                'text-red-500',
                'Buddies',
                !isRegisteredUserSession
            )}
        </Card.Content>
    </Card.Root>
</div>
