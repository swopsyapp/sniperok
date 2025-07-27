<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { getFlash } from 'sveltekit-flash-message';
    import Icon from '@iconify/svelte';

    import { page } from '$app/stores';
    import { goto, invalidateAll } from '$app/navigation';

    import { logger } from '$lib/logger';
    import { calculateTimeDifference, HttpStatus, type TimeDiff } from '$lib/utils';
    import { Status } from '$lib/model/model.d';
    import { clientMessageHandler, type Message } from '$lib/components/messages.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card/index';
    import * as Table from '$lib/components/ui/table/index';
    import * as Tooltip from '$lib/components/ui/tooltip/index';
    import { buttonVariants } from '$lib/components/ui/button';

    import type { PageData } from './$types';

    const flash = getFlash(page);
    const iconGhost = buttonVariants({ variant: 'ghost', size: 'icon' });

    let { data }: { data: PageData } = $props();
    const games = $derived(data.games);
    const username = $derived(data.user?.user_metadata.username ?? 'Guest');
    const isRegistered = $derived(data.user && !data.user.is_anonymous);

    let countdown = $state(10);
    let timer: NodeJS.Timeout | null = null;

    onMount(() => {
        timer = setInterval(() => {
            countdown -= 1;
        }, 1000);
    });

    onDestroy(() => {
        if (timer) {
            clearInterval(timer);
        }
    });

    function getTimeDiff(startTime: Date, countdown: number): TimeDiff {
        return calculateTimeDifference(startTime);
    }

    function timeColor(diff: number): string {
        return diff < 0 ? ' text-red-500' : '';
    }

    async function joinGame(gameId: number) {
        if (!data.user) {
            $flash = { type: 'error', message: 'User not logged in' };
            return;
        }
        const joinGameUrl = $page.url.href.concat(`/[${gameId}]/join`);
        const response = await fetch(joinGameUrl, {
            method: 'POST'
        });

        if (response.status == HttpStatus.SEE_OTHER) {
            const redirectLocation = response.headers.get('location') ?? '/#';
            logger.warn('redirecting to ', redirectLocation);
            // Must be logged in as registered or anonymous
            // $flash = { type: 'error', message: 'User not logged in' };
            goto(redirectLocation);
        }

        if (response.status == HttpStatus.UNAUTHORIZED) {
            // Must be logged in as registered or anonymous
            $flash = { type: 'error', message: 'User not logged in' };
            return;
        }

        if (response.status == HttpStatus.NOT_FOUND) {
            const errMsg = 'Game not found';
            logger.warn(errMsg);
            $flash = { type: 'error', message: errMsg };
            return;
        }

        if (response.status != HttpStatus.OK || response.url != joinGameUrl) {
            logger.error('error status : ', response.status, response.url);
            $flash = { type: 'error', message: 'An error occurred' };
            return;
        }

        const json = await response.json();
        logger.debug('joinGame response.json : ', json);
        const playerSeq = json.playerSeq;

        clientMessageHandler.joinGameChannel(gameId, playerSeq);

        $flash = { type: 'success', message: 'Joined game' };

        goto(`/games/[${gameId}]`, { invalidateAll: true });
    }

    async function deleteGame(gameId: number) {
        const gameUrl = $page.url.href.concat(`/[${gameId}]`);
        const response = await fetch(gameUrl, {
            method: 'DELETE'
        });

        const json = await response.json();
        logger.trace('json : ', json);

        if (response.status == HttpStatus.FORBIDDEN) {
            logger.trace('forbidden');
            $flash = { type: 'error', message: 'You are not a curator' };
            return;
        }

        if (response.status != HttpStatus.OK) {
            logger.error('error status : ', json.status);
            $flash = { type: 'error', message: 'An error occurred' };
            return;
        }

        $flash = { type: 'success', message: 'Game deleted' };

        invalidateAll();
    }
</script>

{#snippet startTime(gameStatus: string, timeDiff: TimeDiff)}
    {#if Status.INACTIVE.equals(gameStatus)}
        <Table.Cell class="w-20 px-1 font-medium"><center>-</center></Table.Cell>
    {:else}
        <Table.Cell class="w-20 px-1 font-medium {timeColor(timeDiff.diff)}"
            >{timeDiff.formatted}</Table.Cell
        >
    {/if}
{/snippet}

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <span class="flex w-full justify-center">
                <Card.Title class="w-10/12 text-center text-4xl font-thin">Games</Card.Title>
                {#if isRegistered}
                    <Button href="/games/new" class="w-2/12">
                        <div class="flex items-center gap-2">
                            <Icon icon="mdi:add-bold" class="h-5 w-5 text-green-600" />
                        </div>
                    </Button>
                {/if}
            </span>
        </Card.Header>
        <Card.Content>
            <div class="overflow-x-hidden">
                <Table.Root class="w-full">
                    <Table.Header>
                        <Table.Row>
                            <Table.Head class="px-1">Start</Table.Head>
                            <Table.Head class="px-1">Players</Table.Head>
                            <Table.Head class="px-1">Rounds</Table.Head>
                            <Table.Head class="w-28 text-right">Action</Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#each games as game}
                            <Table.Row>
                                {@render startTime(
                                    game.status,
                                    getTimeDiff(game.startTime, countdown)
                                )}
                                <Table.Cell class="px-1 font-medium"
                                    >{game.players} / {game.minPlayers}</Table.Cell
                                >
                                <Table.Cell class="px-1 font-medium">{game.maxRounds}</Table.Cell>
                                <Table.Cell class="font-medium">
                                    <span class="flex">
                                        <Tooltip.Provider>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger
                                                    onclick={() => joinGame(game.id)}
                                                    class={iconGhost}
                                                >
                                                    <Icon icon="gg:enter" class="text-green-600" />
                                                    <span class="sr-only">Join</span>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content
                                                    ><p>
                                                        Join<sup class="text-gray-400"
                                                            >{game.id}</sup
                                                        >
                                                    </p></Tooltip.Content
                                                >
                                            </Tooltip.Root>
                                        </Tooltip.Provider>
                                        {#if game.curator == username}
                                            <Tooltip.Provider>
                                                <Tooltip.Root>
                                                    <Tooltip.Trigger class={iconGhost}>
                                                        <a href="/games/[{game.id}]">
                                                            <Icon
                                                                icon="line-md:edit"
                                                                class="text-green-600"
                                                            />
                                                        </a>
                                                        <span class="sr-only">Edit</span>
                                                    </Tooltip.Trigger>
                                                    <Tooltip.Content><p>Edit</p></Tooltip.Content>
                                                </Tooltip.Root>
                                            </Tooltip.Provider>
                                            <Tooltip.Provider>
                                                <Tooltip.Root>
                                                    <Tooltip.Trigger
                                                        onclick={() => deleteGame(game.id)}
                                                        class={iconGhost}
                                                    >
                                                        <Icon
                                                            icon="flowbite:trash-bin-outline"
                                                            class="text-red-600"
                                                        />
                                                        <span class="sr-only">Delete</span>
                                                    </Tooltip.Trigger>
                                                    <Tooltip.Content><p>Delete</p></Tooltip.Content>
                                                </Tooltip.Root>
                                            </Tooltip.Provider>
                                        {/if}
                                    </span>
                                </Table.Cell>
                            </Table.Row>
                        {/each}
                    </Table.Body>
                </Table.Root>
            </div>
        </Card.Content>
    </Card.Root>
</div>
