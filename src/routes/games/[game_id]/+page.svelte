<script lang="ts">
    import { onMount } from 'svelte';
    import Icon from '@iconify/svelte';
    import { getFlash } from 'sveltekit-flash-message';

    import { logger } from '$lib/logger';
    import { Status, type GameDetail, type RoundScore } from '$lib/model/model.d';
    import { calculateTimeDifference, HttpStatus, sleep, type TimeDiff } from '$lib/utils';
    import { clientMessageHandler, MessageType } from '$lib/components/messages.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card/index';
    import * as Table from '$lib/components/ui/table/index';
    import * as Tooltip from '$lib/components/ui/tooltip/index';

    import { page } from '$app/stores';
    import { goto, invalidateAll } from '$app/navigation';
    import type { PageData } from './$types';

    const countdownAmber = '#ffa200';
    const countdownGreen = '#22c55e';
    const countdownDefault = 'currentColor';

    const flash = getFlash(page);

    let { data }: { data: PageData } = $props();
    logger.debug('gameDetail : ', data.gameDetail);

    let game: GameDetail = $derived(data.gameDetail);
    let username = $derived(data.user?.user_metadata.username ?? 'Guest');
    let isGamePending = $derived(Status.PENDING.equals(game.status));
    let isUserGameCurator = $derived(game.curator == username);

    const roundStatusWaiting = 'Waiting';
    const roundStatusReady = 'Start';
    const roundStatusStarting = 'Starting ...';
    const roundStatusPlaying = 'Playing ...';
    const roundStatusPlayed = 'Played ...';
    const roundStatusScoring = 'Scoring ...';
    // svelte-ignore state_referenced_locally
    let roundStatusDone = $derived(game.currentRound < game.maxRounds ? 'Next' : 'Done');

    // svelte-ignore state_referenced_locally
    let timeDifference = $state(calculateTimeDifference(game.startTime));
    let timeColor = $derived(getTimeColor(timeDifference));
    let gameRefreshErrorCount = 0;

    // svelte-ignore state_referenced_locally
    let roundStatus = $state(
        isGamePending
            ? roundStatusWaiting
            : Status.INACTIVE.equals(game.currentRoundStatus)
              ? roundStatusDone
              : roundStatusReady
    );
    let isPlayable = $derived(roundStatus == roundStatusPlaying);
    let isRoundStarted = $derived(setRoundStarted(roundStatus));
    let countdownColor = $derived(setCountDownColor(roundStatus));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let roundPlayerCount = $state(0);
    let roundResponseCount = $state(0);
    let roundStartTime: Date | undefined = $state(undefined);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let runCountdown = $state(false);
    let count = $state(3);
    let progress = $state(0);
    let roundPlayMillis: number | undefined = $state(undefined);
    let roundScore: RoundScore | undefined = $state(undefined);

    onMount(() => {
        const interval = setInterval(() => {
            timeDifference = calculateTimeDifference(game.startTime);
            refreshGameStatus();
        }, 1000);

        clientMessageHandler.on(MessageType.JoinGame, (message) => {
            if (message.sender != username) {
                if (isRoundStarted) {
                    logger.debug('join message ignored during play');
                } else {
                    invalidateAll();
                }
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        clientMessageHandler.on(MessageType.StartRound, (message) => {
            if (roundStatus == roundStatusReady) {
                logger.debug('round starting');
                roundStatus = roundStatusStarting;
                roundPlayerCount = game.connected ?? -1;
                startCountdown();
            } else {
                logger.debug('Ignoring startMessage, roundStatus:', roundStatus);
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        clientMessageHandler.on(MessageType.RoundPlayed, (message) => {
            if (isRoundStarted) {
                roundResponseCount = roundResponseCount + 1;
            }
        });

        clientMessageHandler.on(MessageType.NextRound, (message) => {
            logger.debug('NextRound message received : ', message);
            if (roundStatus === roundStatusDone) {
                roundStatus = roundStatusReady;
            }
            invalidateAll();
        });

        if (roundStatus == roundStatusDone) {
            loadRoundScore();
        }

        return () => clearInterval(interval);
    });

    function getTimeColor(timeDiff: TimeDiff): string {
        return timeDiff.diff < 0 ? 'text-red-500' : '';
    }

    function getPlayersColor(): string {
        return game.players < game.minPlayers ? 'text-red-500' : '';
    }

    function setRoundStarted(roundStatus: string) {
        if (
            roundStatus == roundStatusStarting ||
            roundStatus == roundStatusPlaying ||
            roundStatus == roundStatusScoring
        ) {
            return true;
        } else {
            return false;
        }
    }

    function setCountDownColor(roundStatus: string) {
        if (
            roundStatus == roundStatusWaiting ||
            roundStatus == roundStatusReady ||
            roundStatus == roundStatusStarting
        ) {
            return countdownAmber;
        } else if (roundStatus == roundStatusPlaying) {
            return countdownGreen;
        } else {
            return countdownDefault;
        }
    }

    async function refreshGameStatus() {
        if (isGamePending) {
            if (timeDifference.diff <= 0 && game.players >= game.minPlayers) {
                // PATCH status refresh
                const statusRefreshUrl = $page.url.href.concat(`/status`);
                const response = await fetch(statusRefreshUrl, {
                    method: 'PATCH'
                });

                if (response.status == HttpStatus.OK && response.url == statusRefreshUrl) {
                    logger.debug('gameStatusRefresh OK', response.status, response.url);
                    const json = await response.json();
                    logger.debug('statusRefresh response.json : ', json);

                    gameRefreshErrorCount = 0;
                    await invalidateAll();
                    const refreshedGameStatus = json.newStatus;
                    if (
                        roundStatus == roundStatusWaiting &&
                        Status.ACTIVE.equals(refreshedGameStatus)
                    ) {
                        roundStatus = roundStatusReady;
                    }
                } else {
                    gameRefreshErrorCount = gameRefreshErrorCount + 1;
                    logger.error(
                        `error status[${gameRefreshErrorCount}] : ${response.status} ${response.url}`
                    );
                    if (gameRefreshErrorCount >= 3) {
                        $flash = {
                            type: 'error',
                            message: 'An error occurred while refreshing the game'
                        };
                        goto('/');
                    }
                }
            }
        }
    }

    async function updateRoundStatus(status: string): Promise<boolean> {
        if (!isUserGameCurator) {
            return false;
        }
        // PUT Update round.status
        const updateRoundStatusUrl = $page.url.href.concat('/round/status');
        const response = await fetch(updateRoundStatusUrl, {
            method: 'PUT',
            body: JSON.stringify({
                status: status
            })
        });

        if (response.status != HttpStatus.OK || response.url != updateRoundStatusUrl) {
            logger.error('error status : ', response.status, response.url);
            $flash = { type: 'error', message: 'An error occurred' };
            return false;
        }

        const json = await response.json();
        if (json.success) {
            logger.debug(`updateRoundStatus(${status}) ok response.json : ${json}`);
        } else {
            logger.error(`updateRoundStatus(${status}) error response.json : ${json}`);
            $flash = { type: 'error', message: 'An error occurred' };
        }

        return json.success;
    }

    async function loadRoundScore() {
        // GET round score
        const updateRoundStatusUrl = $page.url.href.concat(`/round/[${game.currentRound}]`);
        const response = await fetch(updateRoundStatusUrl, {
            method: 'GET'
        });

        if (response.status != HttpStatus.OK || response.url != updateRoundStatusUrl) {
            logger.error('error status : ', response.status, response.url);
            $flash = { type: 'error', message: 'An error occurred' };
            return false;
        }

        roundScore = await response.json();
        logger.debug('roundScore ', roundScore);
    }

    function startCountdown() {
        roundStartTime = new Date();
        runCountdown = true;
        count = 3;
        progress = 0;

        const countdownInterval = setInterval(async () => {
            progress += 1 / 30;

            if (progress >= 1) {
                count -= 1;
                progress = 0;
            }

            if (count === 0) {
                clearInterval(countdownInterval);
                runCountdown = false;
                if (roundStatus == roundStatusStarting) {
                    roundStatus = roundStatusPlaying;
                    count = -1;
                    await sleep(1000);
                    startCountdown();
                } else {
                    if (roundStatus == roundStatusPlaying) {
                        roundStatus = roundStatusScoring;
                        count = -1;
                        startCountdown();
                    } else {
                        roundStatus = roundStatusDone;
                        const result = await updateRoundStatus('inactive');
                        if (result) {
                            logger.debug('round is finalised');
                        } else {
                            logger.error('Error finalising round');
                        }
                        loadRoundScore();
                        invalidateAll();
                    }
                }
            }
        }, 33.33); // ~30fps
    }

    async function handleStartClick() {
        if (roundStatus == roundStatusReady) {
            const result = await updateRoundStatus(Status.ACTIVE.toString());
            if (!result) {
                return;
            }

            clientMessageHandler.sendStartRound(game.gameId, username, game.currentRound);
        }
        if (roundStatus == roundStatusDone) {
            logger.debug('Clicked ', roundStatus);

            if (game.currentRound < game.maxRounds) {
                // POST next round
                const response = await fetch($page.url.href.concat('/round'), {
                    method: 'POST'
                });

                const json = await response.json();
                logger.debug('nextRound response.json : ', json);

                if (response.status != HttpStatus.OK) {
                    logger.error('error status : ', response.status);
                    $flash = { type: 'error', message: 'An error occurred' };
                    roundStatus = roundStatusScoring;
                    count = -1;
                    startCountdown();
                    return;
                } else {
                    clientMessageHandler.sendNextRound(json.gameId, json.currentRound);
                }
            } else {
                // PATCH status refresh
                const statusRefreshUrl = $page.url.href.concat(`/status`);
                const response = await fetch(statusRefreshUrl, {
                    method: 'PATCH'
                });

                logger.debug(`response.status=${response.status}, url=${statusRefreshUrl}`);

                goto('/games', { replaceState: true, invalidateAll: true });
            }
        }
    }

    function polarToCartesian(
        centerX: number,
        centerY: number,
        radius: number,
        angleInDegrees: number
    ) {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians)
        };
    }

    function describeArc(
        x: number,
        y: number,
        radius: number,
        startAngle: number,
        endAngle: number
    ) {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(
            ' '
        );
    }

    async function play(weapon: string) {
        if (roundStatus == roundStatusPlaying && roundStartTime) {
            roundStatus = roundStatusPlayed;
            const now = new Date();
            roundPlayMillis = now.getTime() - roundStartTime.getTime();
            logger.debug(`Played ${weapon} in ${roundPlayMillis} millis`);

            // PUT play turn
            const response = await fetch($page.url.href, {
                method: 'PUT',
                body: JSON.stringify({
                    roundSeq: game.currentRound,
                    weaponPlayed: weapon,
                    responseTimeMillis: roundPlayMillis
                })
            });

            const json = await response.json();
            logger.debug('playTurn response.json : ', json);

            if (response.status != HttpStatus.OK || !json.success) {
                logger.error('error status : ', response.status);
                $flash = { type: 'error', message: 'An error occurred' };
                roundStatus = roundStatusPlaying;
                return;
            } else {
                clientMessageHandler.sendRoundPlayed(game.gameId, game.currentRound);
            }
        } else {
            logger.debug(`Disabled click on ${weapon} ignored`);
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
                        <div class="font-bold text-gray-600 dark:text-gray-300">
                            {game.status}
                        </div>
                    </td>
                    <td>
                        <div class="text-sm text-gray-500">Curator</div>
                        <div class="font-bold text-gray-600 dark:text-gray-300">{game.curator}</div>
                    </td>
                    <td>
                        <div class="text-sm text-gray-500">Start Time</div>
                        {#if Status.INACTIVE.equals(game.status)}
                            <div class="font-bold"><center>-</center></div>
                        {:else}
                            <div class="font-bold {timeColor}">{timeDifference.formatted}</div>
                        {/if}
                    </td>
                </tr>
                <tr class="text-center">
                    <td>
                        <div class="text-sm text-gray-500">Players</div>
                        <div class="font-bold text-gray-600 dark:text-gray-300">
                            <Tooltip.Provider>
                                <Tooltip.Root>
                                    <Tooltip.Trigger
                                        >{game.connected} /
                                        <span class={getPlayersColor()}>{game.players}</span>
                                        ({game.minPlayers})</Tooltip.Trigger
                                    >
                                    <Tooltip.Content>
                                        <p class="text-sm text-gray-500">
                                            {game.connected} connected of {game.players} joined, with
                                            a min of ({game.minPlayers}) required
                                        </p>
                                    </Tooltip.Content>
                                </Tooltip.Root>
                            </Tooltip.Provider>
                        </div>
                    </td>
                    <td>
                        <div class="text-sm text-gray-500">Public</div>
                        <div class="font-bold text-gray-600 dark:text-gray-300">
                            {game.isPublic ? 'Yes' : 'No'}
                        </div>
                    </td>
                    <td>
                        <div class="text-sm text-gray-500">Round</div>
                        <div class="font-bold text-gray-600 dark:text-gray-300">
                            {game.currentRound} of {game.maxRounds}
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <br />
        <Button
            id="roundStart"
            disabled={(game.currentRound < game.maxRounds && !isUserGameCurator && roundStatus != roundStatusDone) ||
                (isUserGameCurator &&
                    roundStatus != roundStatusReady &&
                    roundStatus != roundStatusDone)}
            class="w-full"
            onclick={handleStartClick}
        >
            <div class="flex items-center gap-2">
                <Icon icon="charm:circle-tick" class="h-5 w-5 text-green-500" />
                <span>{roundStatus}</span>
            </div>
        </Button>

        <div class="mt-4 justify-center">
            {#if roundStatus == roundStatusDone && roundScore}
                <div>
                    <Table.Root class="w-full">
                        <Table.Header>
                            <Table.Row>
                                <Table.Head class="px-1">Player</Table.Head>
                                <Table.Head class="px-1">Weapon</Table.Head>
                                <Table.Head class="px-1 text-right">Wins</Table.Head>
                                <Table.Head class="px-1 text-right">Losses</Table.Head>
                                <Table.Head class="px-1 text-right">Ties</Table.Head>
                                <Table.Head class="px-1 text-right">score</Table.Head>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {#each roundScore.scores as playerScore}
                                <Table.Row>
                                    <Table.Cell class="px-1 font-medium"
                                        >{playerScore.username}</Table.Cell
                                    >
                                    <Table.Cell class="px-1 font-medium"
                                        >{playerScore.weapon}</Table.Cell
                                    >
                                    <Table.Cell class="px-1 font-medium text-right"
                                        >{playerScore.wins}</Table.Cell
                                    >
                                    <Table.Cell class="px-1 font-medium text-right"
                                        >{playerScore.losses}</Table.Cell
                                    >
                                    <Table.Cell class="px-1 font-medium text-right"
                                        >{playerScore.ties}</Table.Cell
                                    >
                                    <Table.Cell class="px-1 font-medium text-right"
                                        >{playerScore.score}</Table.Cell
                                    >
                                </Table.Row>
                            {/each}
                        </Table.Body>
                    </Table.Root>
                    {#if data.gameSummary}
                        <Table.Root class="mt-4 w-full">
                            <Table.Header>
                                <Table.Row>
                                    <Table.Head class="px-1">Overall Game Results</Table.Head>
                                    <Table.Head class="px-1 text-right">Total Score</Table.Head>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {#each data.gameSummary as playerSummary}
                                    <Table.Row>
                                        <Table.Cell class="px-1 font-medium"
                                            >{playerSummary.username}</Table.Cell
                                        >
                                        <Table.Cell class="px-1 font-medium text-right"
                                            >{playerSummary.total_wins}</Table.Cell
                                        >
                                    </Table.Row>
                                {/each}
                            </Table.Body>
                        </Table.Root>
                    {/if}
                </div>
            {:else}
                <svg id="game-svg" width="350" height="350" viewBox="0 0 350 350">
                    <!-- Outer ring segments -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <path
                        d={describeArc(175, 175, 125, 0, 120)}
                        class="cursor-pointer {isPlayable ? 'hover:opacity-80' : 'opacity-50'}"
                        fill="none"
                        stroke="rgb(255, 100, 0)"
                        stroke-width="40"
                        onclick={() => play('dynamite')}
                    >
                        <title>Dynamite</title>
                    </path>
                    <!-- Dynamite icon -->
                    <foreignObject x="264" y="95" width="35" height="35">
                        <!-- svelte-ignore a11y_invalid_attribute -->
                        <a
                            title="Dynamite"
                            onclick={() => play('dynamite')}
                            href="javascript:void(0)"
                        >
                            <Icon
                                icon="fluent-emoji-high-contrast:thumbs-up"
                                class="h-8 w-8 text-gray-200"
                            />
                        </a>
                    </foreignObject>

                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <path
                        d={describeArc(175, 175, 125, 120, 240)}
                        class="cursor-pointer {isPlayable ? 'hover:opacity-80' : 'opacity-50'}"
                        fill="none"
                        stroke="rgb(0, 150, 0)"
                        stroke-width="40"
                        onclick={() => play('bazooka')}
                    >
                        <title>Bazooka</title>
                    </path>
                    <!-- Bazooka icon -->
                    <foreignObject x="160" y="285" width="35" height="35">
                        <!-- svelte-ignore a11y_invalid_attribute -->
                        <a
                            title="Bazooka"
                            onclick={() => play('bazooka')}
                            href="javascript:void(0)"
                        >
                            <Icon
                                icon="fluent-emoji-high-contrast:pinched-fingers"
                                class="h-8 w-8 text-gray-200"
                            />
                        </a>
                    </foreignObject>

                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <path
                        d={describeArc(175, 175, 125, 240, 360)}
                        class="cursor-pointer {isPlayable ? 'hover:opacity-80' : 'opacity-50'}"
                        fill="none"
                        stroke="purple"
                        stroke-width="40"
                        onclick={() => play('shotgun')}
                    >
                        <title>Shotgun</title>
                    </path>
                    <!-- Shotgun icon -->
                    <foreignObject x="53" y="95" width="35" height="35">
                        <!-- svelte-ignore a11y_invalid_attribute -->
                        <a
                            title="Shotgun"
                            onclick={() => play('shotgun')}
                            href="javascript:void(0)"
                        >
                            <Icon
                                icon="fluent-emoji-high-contrast:sign-of-the-horns"
                                class="h-8 w-8 text-gray-200"
                            />
                        </a>
                    </foreignObject>

                    <!-- Main ring segments -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <path
                        d={describeArc(175, 175, 80, 300, 60)}
                        class="cursor-pointer {isPlayable ? 'hover:opacity-80' : 'opacity-50'}"
                        fill="none"
                        stroke="red"
                        stroke-width="40"
                        onclick={() => play('rock')}
                    >
                        <title>Rock</title>
                    </path>
                    <!-- Rock icon -->
                    <foreignObject x="155" y="80" width="35" height="35">
                        <!-- svelte-ignore a11y_invalid_attribute -->
                        <a title="Rock" onclick={() => play('rock')} href="javascript:void(0)">
                            <Icon icon="fa:hand-rock-o" class="h-8 w-8 text-gray-200" />
                        </a>
                    </foreignObject>

                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <path
                        d={describeArc(175, 175, 80, 60, 180)}
                        class="cursor-pointer {isPlayable ? 'hover:opacity-80' : 'opacity-50'}"
                        fill="none"
                        stroke="yellow"
                        stroke-width="40"
                        onclick={() => play('paper')}
                    >
                        <title>Paper</title>
                    </path>
                    <!-- Paper icon -->
                    <foreignObject x="228" y="195" width="35" height="35">
                        <!-- svelte-ignore a11y_invalid_attribute -->
                        <a title="Paper" onclick={() => play('paper')} href="javascript:void(0)">
                            <Icon icon="fa:hand-paper-o" class="h-8 w-8 text-gray-200" />
                        </a>
                    </foreignObject>

                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <path
                        d={describeArc(175, 175, 80, 180, 300)}
                        class="cursor-pointer {isPlayable ? 'hover:opacity-80' : 'opacity-50'}"
                        fill="none"
                        stroke="blue"
                        stroke-width="40"
                        onclick={() => play('scissors')}
                    >
                        <title>Scissors</title>
                    </path>
                    <!-- Scissors icon -->
                    <foreignObject x="86" y="195" width="35" height="35">
                        <!-- svelte-ignore a11y_invalid_attribute -->
                        <a
                            title="Scissors"
                            onclick={() => play('scissors')}
                            href="javascript:void(0)"
                        >
                            <Icon icon="fa:hand-scissors-o" class="h-8 w-8 text-gray-200" />
                        </a>
                    </foreignObject>

                    <!-- Inner countdown circle (existing code) -->
                    <circle
                        cx="175"
                        cy="175"
                        r="45"
                        fill="none"
                        stroke="#e2e8f0"
                        stroke-width="8"
                    />
                    <circle
                        cx="175"
                        cy="175"
                        r="45"
                        fill="none"
                        stroke={countdownColor}
                        stroke-width="8"
                        stroke-linecap="round"
                        transform="rotate(-90 175 175)"
                        style="stroke-dasharray: 283; stroke-dashoffset: {283 - 283 * progress}"
                    />
                    <text
                        x="175"
                        y="175"
                        text-anchor="middle"
                        dy="7"
                        font-size="30"
                        fill={countdownColor}
                    >
                        {count == -1 ? 'Go!' : count}
                    </text>
                </svg>
            {/if}
        </div>
    </Card.Content>
</Card.Root>
