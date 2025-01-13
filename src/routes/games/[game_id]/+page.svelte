<script lang="ts">
    import { onMount } from 'svelte';
    import Icon from '@iconify/svelte';
    import { getFlash } from 'sveltekit-flash-message';

    import { logger } from '$lib/logger';
    import { getStatusText, Status, type GameDetail } from '$lib/model/model.d';
    import { calculateTimeDifference, HttpStatus, type TimeDiff } from '$lib/utils';
    import { clientMessageHandler, MessageType } from '$lib/components/messages.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card/index';
    import * as Tooltip from '$lib/components/ui/tooltip/index';

    import { page } from '$app/stores';
    import { invalidateAll } from '$app/navigation';
    import type { PageData } from './$types';
    
    const flash = getFlash(page);

    let { data }: { data: PageData } = $props();
    logger.trace('gameDetail : ', data.gameDetail);

    let game : GameDetail = $derived(data.gameDetail);
    let username = $derived(data.user?.user_metadata.username);
    let isGameReady = $derived( (game.status == Status.active) );

    let timeDifference = $state(calculateTimeDifference(game.startTime));
    let timeColor = $derived(getTimeColor(timeDifference));

    let runCountdown = $state(false);
    let count = $state(3);
    let progress = $state(0);

    onMount(() => {
        const interval = setInterval(() => {
            timeDifference = calculateTimeDifference(game.startTime);
            refreshGameStatus();
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

    async function refreshGameStatus() {
        if (!isGameReady) {
            if (timeDifference.diff <= 0 && game.players >= game.minPlayers) {
                // PATCH status refresh
                const statusRefreshUrl = $page.url.href.concat(`/status`);
                const response = await fetch(statusRefreshUrl, {
                    method: 'PATCH',
                });

                const json = await response.json();
                logger.debug('statusRefresh response.json : ', json);

                if (response.status != HttpStatus.OK) {
                    logger.error('error status : ', response.status);
                    $flash = { type: 'error', message: 'An error occurred' };
                    return;
                }

                invalidateAll();
            }
        }
    }

    function startCountdown() {
        runCountdown = true;
        count = 3;
        progress = 0;
        
        const countdownInterval = setInterval(() => {
            progress += 1/30;
            
            if (progress >= 1) {
                count -= 1;
                progress = 0;
            }
            
            if (count === 0) {
                clearInterval(countdownInterval);
                runCountdown = false;
            }
        }, 33.33); // ~30fps
    }

    function handleStartClick() {
        if (isGameReady) {
            startCountdown();
        }
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
                        <div class="font-bold text-gray-600 dark:text-gray-300">{game.currentRound} of {game.rounds}</div>
                    </td>
                </tr>
            </tbody>
        </table>

        <br/>
        <Button id="roundStart" disabled={ !isGameReady } class="w-full" onclick={handleStartClick}>
            <div class="flex items-center gap-2">
                <Icon
                    icon="charm:circle-tick"
                    class="h-5 w-5 text-green-500"
                />
                <span>{isGameReady ? 'Ready' : 'Waiting' }</span>
            </div>
        </Button>

        <div class="flex justify-center mt-4">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e2e8f0"
                    stroke-width="8"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#22c55e"
                    stroke-width="8"
                    stroke-linecap="round"
                    transform="rotate(-90 50 50)"
                    style="stroke-dasharray: 283; stroke-dashoffset: {283 - (283 * progress)}"
                />
                <text
                    x="50"
                    y="50"
                    text-anchor="middle"
                    dy="7"
                    font-size="30"
                    fill="currentColor"
                >
                    {count}
                </text>
            </svg>
        </div>

    </Card.Content>
</Card.Root>
