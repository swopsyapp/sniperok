<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import Icon from '@iconify/svelte';

    import * as Card from '$lib/components/ui/card/index';
    import * as Table from '$lib/components/ui/table/index';
    import * as Tooltip from '$lib/components/ui/tooltip/index';
    import { buttonVariants } from '$lib/components/ui/button';

    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    const games = $derived(data.games);
    const username = $derived(data.user?.user_metadata.username);

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

</script>

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-4xl font-thin">List of Games</Card.Title>
            <!-- <Card.Description>Welcome</Card.Description> -->
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
                                    {#if game.curator == username}
                                        <Tooltip.Provider>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger
                                                    class={buttonVariants({
                                                        variant: 'ghost',
                                                        size: 'icon'
                                                    })}
                                                >
                                                    <a href="/games/[{game.id}]">
                                                        <Icon
                                                            id="gameEditBtn_{game.id}"
                                                            icon='line-md:edit'
                                                            class='text-green-600'
                                                        />
                                                    </a>
                                                <span class="sr-only">Edit</span>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content><p>Edit</p></Tooltip.Content>
                                            </Tooltip.Root>
                                        </Tooltip.Provider>
                                    {:else}
                                        <span>join</span>
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
