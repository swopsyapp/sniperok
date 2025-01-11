<script lang="ts">
    import { onMount } from 'svelte';

    import { logger } from '$lib/logger';
    import { getStatusText } from '$lib/model/status.d';
    import { calculateTimeDifference, type TimeDiff } from '$lib/utils';
    import { clientMessageHandler, MessageType } from '$lib/components/messages.svelte';
    import * as Card from '$lib/components/ui/card/index';
    import * as Tooltip from '$lib/components/ui/tooltip/index';

    import { invalidateAll } from '$app/navigation';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    logger.debug(data.game);

    let game = $derived(data.game);
    let username = $derived(data.user?.user_metadata.username);

    let timeDifference = $state(calculateTimeDifference(game.startTime));
    let timeColor = $derived(getTimeColor(timeDifference));

    onMount(() => {
        const interval = setInterval(() => {
            timeDifference = calculateTimeDifference(game.startTime);
        }, 1000);

        clientMessageHandler.on(MessageType.JoinGame, (message) => {
            if (message.sender != username) {
                invalidateAll();
            }
        });

        return () => clearInterval(interval);
    });

    function getTimeColor(timeDiff: TimeDiff) : string {
        return (timeDiff.diff < 0 ) ? 'text-red-500' : '';
    }

    function getPlayersColor(): string {
        return ( game.players < game.minPlayers) ? 'text-red-500' : '';
    }
</script>

<Card.Root class="mx-auto max-w-md">
    <Card.Header>
        <Card.Title class="w-10/12 text-center text-4xl font-thin">Game</Card.Title>                
    </Card.Header>
    <Card.Content>

        <table class="w-full text-lg">
            <tbody>
                <tr class="text-center">
                    <td>
                        <div class="text-sm text-gray-500">Status</div>
                        <div class="font-bold text-gray-600 dark:text-gray-300">{getStatusText(game.status)}</div>
                    </td>
                    <td>
                        <div class="text-sm text-gray-500">Curator</div>
                        <div class="font-bold text-gray-600 dark:text-gray-300">{game.curator}</div>
                    </td>
                    <td>
                        <div class="text-sm text-gray-500">Start Time</div>
                        <div class="font-bold {timeColor}">{timeDifference.formatted}</div>
                    </td>
                </tr>
                <tr class="text-center">
                    <td>
                        <div class="text-sm text-gray-500">Players</div>
                        <div class="font-bold text-gray-600 dark:text-gray-300">
                            <Tooltip.Provider>
                                <Tooltip.Root>
                                  <Tooltip.Trigger>{game.connected} / <span class="{getPlayersColor()}">{game.players}</span> ({game.minPlayers})</Tooltip.Trigger>
                                  <Tooltip.Content>
                                    <p class="text-sm text-gray-500">{game.connected} connected of {game.players} joined, with a min of ({game.minPlayers}) required</p>
                                  </Tooltip.Content>
                                </Tooltip.Root>
                              </Tooltip.Provider>
                        </div>
                    </td>
                    <td>
                        <div class="text-sm text-gray-500">Public</div>
                        <div class="font-bold text-gray-600 dark:text-gray-300">{game.isPublic ? 'Yes' : 'No'}</div>
                    </td>
                    <td>
                        <div class="text-sm text-gray-500">Round</div>
                        <div class="font-bold text-gray-600 dark:text-gray-300">1 of {game.rounds}</div>
                    </td>
                </tr>
            </tbody>
        </table>

    </Card.Content>
</Card.Root>
