<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { getFlash } from 'sveltekit-flash-message';
    import Icon from '@iconify/svelte';

    import { page } from '$app/stores';
    import { goto, invalidateAll } from '$app/navigation';

    import { logger } from '$lib/logger';
    import { HttpStatus } from '$lib/utils';
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
    const userName = $derived(data.user?.user_metadata.username);
    const isRegistered = $derived(data.user && !data.user.is_anonymous);

    let countdown = $state(10);
    let timer: NodeJS.Timeout | null  = null;

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

    function timeDiff(startTime : Date, countdown : number) : number {
        const now = new Date();
        const diff = startTime.getTime() - now.getTime();

        return Math.trunc(diff / 1000);
    }

    function timeColor(startTime : Date, countdown : number) : string {
        let textColor = '';
        const diff = timeDiff(startTime, countdown);
        if (diff < 0) {
            textColor = ' text-red-500';
        }
        return textColor;
    }

    async function joinGame(gameId : string) {
        if ( !data.user ) {
            $flash = { type: 'error', message: 'User not logged in' };
            return;
        }
        const gameUrl = $page.url.href.concat(`/[${gameId}]`);
        const response = await fetch(gameUrl, {
            method: 'PATCH',
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

        if (response.status != HttpStatus.OK) {
            logger.error('error status : ', response.status);
            $flash = { type: 'error', message: 'An error occurred' };
            return;
        }

        $flash = { type: 'success', message: 'Joined game' };

        goto(`/games/[${gameId}]`);
    }

    async function deleteGame(gameId : string) {
        const gameUrl = $page.url.href.concat(`/[${gameId}]`);
        const response = await fetch(gameUrl, {
            method: 'DELETE',
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

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <span class="flex w-full justify-center">
                <Card.Title class="w-10/12 text-center text-4xl font-thin">Games</Card.Title>
                {#if isRegistered}
                    <Button href="/games/new" class="w-2/12">
                        <div class="flex items-center gap-2">
                            <Icon
                                icon='mdi:add-bold'
                                class='h-5 w-5 text-green-600'
                            />
                        </div>
                    </Button>
                {/if}
            </span>
        </Card.Header>
        <Card.Content>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Start</Table.Head>
                        <Table.Head>Players</Table.Head>
                        <Table.Head>Rounds</Table.Head>
                        <Table.Head class="w-28 text-right">Action</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each games as game}
                        <Table.Row>
                            <Table.Cell class="font-medium {timeColor(game.startTime, countdown)}">{timeDiff(game.startTime, countdown)}</Table.Cell>
                            <Table.Cell class="font-medium">{game.players} / {game.minPlayers}</Table.Cell>
                            <Table.Cell class="font-medium">{game.rounds}</Table.Cell>
                            <Table.Cell class="font-medium">
                                <span class="flex">
                                    <Tooltip.Provider>
                                        <Tooltip.Root>
                                            <Tooltip.Trigger
                                                onclick={() => joinGame(game.id)}
                                                class={iconGhost}
                                            >
                                                <Icon
                                                    icon='gg:enter'
                                                    class='text-green-600'
                                                />
                                            <span class="sr-only">Join</span>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content><p>Join</p></Tooltip.Content>
                                        </Tooltip.Root>
                                    </Tooltip.Provider>
                                    {#if game.curator == userName}
                                        <Tooltip.Provider>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger
                                                    class={iconGhost}
                                                >
                                                    <a href="/games/[{game.id}]">
                                                        <Icon
                                                            icon='line-md:edit'
                                                            class='text-green-600'
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
                                                        icon='flowbite:trash-bin-outline'
                                                        class='text-red-600'
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

        </Card.Content>
    </Card.Root>
</div>
