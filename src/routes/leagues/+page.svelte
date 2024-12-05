<script lang="ts">
    import Icon from '@iconify/svelte';
    import { getFlash } from 'sveltekit-flash-message';

    import { invalidateAll } from '$app/navigation';
    import { page } from '$app/stores';
    import { logger } from '$lib/logger';
    import { buttonVariants } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card/index';
    import { Input } from '$lib/components/ui/input';
    import * as Table from '$lib/components/ui/table/index';
    import * as Tooltip from '$lib/components/ui/tooltip/index.js';

    import type { PageData } from './$types.js';

    const flash = getFlash(page);

    let { data }: { data: PageData } = $props();
    const leagues = $derived(data.leagues);

    logger.trace('leagues : ', leagues);

    let isAdding = $state(false);
    let addButtonIcon = $derived(
        isAdding
            ? 'line-md:minus-square'
            : 'line-md:plus-square'
    ); //line-md:plus-square
    let addClass = $derived(
        isAdding
            ? 'h-6 w-6 rotate-0 scale-100 text-orange-500'
            : 'h-6 w-6 rotate-0 scale-100 text-green-600'
    );
    let addToolTip = $derived(
        isAdding
            ? 'Cancel'
            : 'New'
    );
    let inputClass = $derived(isAdding ? '' : 'text-muted-foreground aria-readonly');
    let leagueName = $state('');

    function addClick() {
        isAdding = !isAdding;

        if (document) {
            const inputElem = document.getElementById('leagueNameInput');
            const buttonElem = document.getElementById('leagueAddBtn');
            if (isAdding) {
                inputElem?.focus();
            } else {
                leagueName = '';
                buttonElem?.focus();
            }
        }
    }

    let confirmClass = $derived(
        isAdding
            ? 'h-6 w-6 rotate-0 scale-100 text-green-600'
            : 'h-6 w-6 rotate-0 scale-100 text-gray-400'
    );

    async function confirmClick() {
        leagueName = leagueName.trim();
        if (leagueName == '') {
            $flash = { type: 'error', message: 'League name cannot be blank' };
            return;
        }

        const newLeagueUrl = encodeURI($page.url.href.concat('?/new&name=', leagueName));
        const response = await fetch(newLeagueUrl, {
            method: "POST",
            body: JSON.stringify({ name: leagueName })
        });

        const json = await response.json();
        logger.trace('json : ', json);

        if (json.status == 406) {
            const msg = 'League name cannot be blank';
            $flash = { type: 'error', message: msg };
            return;
        }

        if (json.status == 409) {
            const msg = `You are already a member of "${leagueName}"`;
            $flash = { type: 'error', message: msg };
            return;
        }

        if (json.status >= 400) {
            $flash = { type: 'error', message: 'An error occurred' };
            return;
        }

        $flash = { type: 'success', message: `League created : ${leagueName}` };

        addClick();
        invalidateAll();

    }
</script>

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-4xl font-thin">Leagues</Card.Title>
            <!-- <Card.Description>Welcome</Card.Description> -->
        </Card.Header>
        <Card.Content>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Name</Table.Head>
                        <Table.Head class="w-28 text-right">Action</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each leagues as league}
                        <Table.Row>
                            <Table.Cell class="font-medium">{league.name}</Table.Cell>
                            <Table.Cell class="text-right"></Table.Cell>
                        </Table.Row>
                    {/each}
                    <Table.Row>
                        <Table.Cell class="font-medium">
                            <Input
                                id="leagueNameInput"
                                bind:value={leagueName}
                                placeholder="-"
                                readonly={!isAdding}
                                class={inputClass}
                            />
                        </Table.Cell>
                        <Table.Cell class="object-right text-right">
                            <span class="flex justify-end">
                                <Tooltip.Provider>
                                    <Tooltip.Root>
                                        <Tooltip.Trigger
                                            onclick={() => addClick()}
                                            class={buttonVariants({
                                                variant: 'ghost',
                                                size: 'icon'
                                            })}
                                        >
                                            <Icon
                                                id="leagueAddBtn"
                                                icon={addButtonIcon}
                                                class={addClass}
                                            />
                                            <span class="sr-only">{addToolTip}</span>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content>
                                            <p>{addToolTip}</p>
                                        </Tooltip.Content>
                                    </Tooltip.Root>
                                </Tooltip.Provider>
                                <Tooltip.Provider>
                                    <Tooltip.Root>
                                        <Tooltip.Trigger
                                            onclick={() => confirmClick()}
                                            class={buttonVariants({
                                                variant: 'ghost',
                                                size: 'icon'
                                            })}
                                        >
                                            <Icon
                                                id="leagueConfirmBtn"
                                                icon="line-md:confirm"
                                                class={confirmClass}
                                            />
                                            <span class="sr-only">Confirm</span>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content>
                                            <p>Confirm</p>
                                        </Tooltip.Content>
                                    </Tooltip.Root>
                                </Tooltip.Provider>
                            </span>
                        </Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
        </Card.Content>
    </Card.Root>
</div>
