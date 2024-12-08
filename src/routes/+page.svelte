<script lang="ts">
    import Icon from '@iconify/svelte';

    import { page } from '$app/stores';
    import * as Card from '$lib/components/ui/card/index';
    import { Button } from '$lib/components/ui/button';
    import { logger } from '$lib/logger';

    // logger.debug('$page.data : ', $page.data);

    // let { user, pendingLeagueCount } = $props();
    // Wierd that user props doesn't behave properly
    let user = $page.data.user;
    let isUserSessionActive : boolean = user ? true : false;

    let pendingLeagueCount : number = parseInt($page.data.pendingLeagueCount);
    let showNewLeagesFlag = (pendingLeagueCount > 0) ? true : false;


    const btnIconClass = 'h-5 w-5';

</script>
{#snippet pageActionButton(href: string, iconName: string, buttonLabel: string, isDisabled: boolean, showNew: boolean = false)}
    {#if (!isDisabled)}
        <Button href={href} class="w-full">
            <div class="flex items-center gap-2">
                <Icon
                    icon={iconName}
                    class='h-5 w-5'
                />
                {buttonLabel}
                {#if showNew }
                <span class="pl-1 text-green-600">
                    *New
                </span>
                {/if}
            </div>
        </Button>
    {:else}
        <Button disabled={true} class="w-full">
            <div class="flex items-center gap-2">
                <Icon
                    icon={iconName}
                    class='h-5 w-5'
                />
                <span>{buttonLabel}</span>
            </div>
        </Button>
    {/if}
    <br />
    <br />
{/snippet}

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-4xl font-thin">Welcome to Junowot</Card.Title>
            <!-- <Card.Description>Welcome</Card.Description> -->
        </Card.Header>
        <Card.Content>
            {@render pageActionButton('/games', 'mdi:format-list-checkbox', 'List Games', false)}
            {@render pageActionButton('/games/[new]', 'mdi:add-bold', 'Create game', !isUserSessionActive)}
            {@render pageActionButton('/leagues', 'mdi:users-group-outline', 'Leagues', !isUserSessionActive, showNewLeagesFlag)}
        </Card.Content>
    </Card.Root>
</div>
