<script lang="ts">
    import Icon from '@iconify/svelte';
    import { getFlash } from 'sveltekit-flash-message';

    import { invalidateAll } from '$app/navigation';
    import { page } from '$app/stores';
    import { logger } from '$lib/logger';
    import { HttpStatus } from '$lib/utils.js';
    import { buttonVariants } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card/index';
    import { Input } from '$lib/components/ui/input';
    import * as Table from '$lib/components/ui/table/index';
    import * as Tooltip from '$lib/components/ui/tooltip/index.js';

    import type { PageData } from './$types.js';

    const flash = getFlash(page);

    let { data }: { data: PageData } = $props();
    const leagues = $derived(data.leagues);
    const user = $derived(data.user);

    // svelte-ignore state_referenced_locally
    logger.trace('leagues : ', leagues);

    let isAdding = $state(false);
    let addButtonIcon = $derived(
        isAdding
            ? 'line-md:u-turn-left'
            : 'line-md:plus-square'
    );
    let addClass = $derived(
        isAdding
            ? 'h-6 w-6 rotate-0 scale-100 text-red-600'
            : 'h-6 w-6 rotate-0 scale-100 text-green-600'
    );
    let addToolTip = $derived(
        isAdding
            ? 'Cancel'
            : 'New'
    );
    let inputClass = $derived(isAdding ? '' : 'text-muted-foreground aria-readonly');
    let leagueName = $state('');

    let confirmClass = $derived(
        isAdding
            ? 'h-6 w-6 rotate-0 scale-100 text-green-600'
            : 'h-6 w-6 rotate-0 scale-100 text-gray-400'
    );

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

    async function confirmClick() {
        if (!isAdding) {
            // button should be disabled
            return;
        }
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

        if (response.status == HttpStatus.NOT_ACCEPTABLE) {
            const msg = 'League name cannot be blank';
            $flash = { type: 'error', message: msg };
            return;
        }

        if (response.status == HttpStatus.CONFLICT) {
            const msg = `You are already a member of "${leagueName}"`;
            $flash = { type: 'error', message: msg };
            return;
        }

        if (response.status != HttpStatus.OK) {
            logger.error(`error status : ${response.status}`);
            $flash = { type: 'error', message: 'An error occurred' };
            return;
        }

        $flash = { type: 'success', message: `League created : ${leagueName}` };

        addClick();
        invalidateAll();
    }

    async function deleteClick(leagueId : string) {
        logger.trace("deleting leagueId : ", leagueId);

        const leagueUrl = $page.url.href.concat(`/[${leagueId}]`);
        const response = await fetch(leagueUrl, {
            method: "DELETE",
        });

        const json = await response.json();
        logger.trace('json : ', json);

        if (response.status == HttpStatus.FORBIDDEN) {
            logger.debug('forbidden');
            const msg = `You are not a curator`;
            $flash = { type: 'error', message: msg };
            return;
        }

        if (response.status != HttpStatus.OK) {
            logger.error('error status : ', json.status);
            $flash = { type: 'error', message: 'An error occurred' };
            return;
        }

        $flash = { type: 'success', message: `League deleted` };

        invalidateAll();
    }

    async function confirmMemberClick(league_id : string, member_id : string) {
        logger.trace("Confirming membership of league : ", league_id);

        const leagueUrl = $page.url.href.concat(`/[${league_id}]/[${member_id}]`);
        const response = await fetch(leagueUrl, {
            method: "PATCH",
            body: JSON.stringify({
                leagueId: league_id,
                memberId: member_id,
                statusCode: 'active'
            })
        });

        const json = await response.json();
        logger.trace('json : ', json);

        if (response.status == HttpStatus.FORBIDDEN) {
            logger.debug('forbidden');
            const msg = `You are not a curator`;
            $flash = { type: 'error', message: msg };
            return;
        }

        if (response.status != HttpStatus.OK) {
            logger.error('error status : ', json.status);
            $flash = { type: 'error', message: 'An error occurred' };
            return;
        }

        $flash = { type: 'success', message: `Membership updated` };

        invalidateAll();
    }

    async function deleteMemberClick(leagueId : string, memberId : string) {
        logger.trace("deleting memberId : ", memberId);

        const memberUrl = $page.url.href.concat(`/[${leagueId}]/[${memberId}]`);
        const response = await fetch(memberUrl, {
            method: "DELETE",
        });

        const json = await response.json();
        logger.trace('json : ', json);

        if (response.status == HttpStatus.FORBIDDEN) {
            logger.debug('forbidden');
            const msg = `You are not a curator`;
            $flash = { type: 'error', message: msg };
            return;
        }

        if (response.status == HttpStatus.NOT_ACCEPTABLE) {
            logger.debug('NOT_ACCEPTABLE ', response);
            const msg = `League must have at least one curator`;
            $flash = { type: 'error', message: msg };
            return;
        }

        if (response.status != HttpStatus.OK) {
            logger.error('error status : ', json.status);
            $flash = { type: 'error', message: 'An error occurred' };
            return;
        }

        $flash = { type: 'success', message: `You have left the league` };

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
                            <Table.Cell>
                                <span class="flex">
                                    <span class="pt-2 text-gray-600">
                                        [{league.memberCount == 0 ? '*' : league.memberCount}]
                                    </span>
                                    {#if (league.name != 'public')}
                                        <Tooltip.Provider>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger
                                                    class={buttonVariants({
                                                        variant: 'ghost',
                                                        size: 'icon'
                                                    })}
                                                >
                                                    <a href="/leagues/[{league.id}]">
                                                        <Icon
                                                            id="leagueEditBtn"
                                                            icon='line-md:edit'
                                                            class='text-green-600'
                                                        />
                                                    </a>
                                                <span class="sr-only">Edit</span>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content><p>Edit</p></Tooltip.Content>
                                            </Tooltip.Root>
                                        </Tooltip.Provider>
                                    {/if}
                                    {#if league.currentUser.isCurator}
                                        <Tooltip.Provider>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger
                                                    onclick={() => deleteClick(league.id)}
                                                    class={buttonVariants({
                                                        variant: 'ghost',
                                                        size: 'icon'
                                                    })}
                                                >
                                                    <Icon
                                                        id="leagueDeleteBtn"
                                                        icon='flowbite:trash-bin-outline'
                                                        class='text-red-600'
                                                    />
                                                <span class="sr-only">Delete</span>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content><p>Delete</p></Tooltip.Content>
                                            </Tooltip.Root>
                                        </Tooltip.Provider>
                                    {/if}
                                    {#if league.currentUser.statusCode == 'pending'}
                                        <Tooltip.Provider>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger
                                                onclick={() => confirmMemberClick(league.id, league.currentUser.memberId)}
                                                    class={buttonVariants({
                                                        variant: 'ghost',
                                                        size: 'icon'
                                                    })}
                                                >
                                                    <Icon
                                                        id="memberConfirmBtn"
                                                        icon='line-md:confirm'
                                                        class='text-green-600'
                                                    />
                                                    <span class="sr-only">Confirm join</span>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content><p>Confirm join</p></Tooltip.Content>
                                            </Tooltip.Root>
                                        </Tooltip.Provider>
                                    {:else if (league.name != 'public')}
                                        <Tooltip.Provider>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger
                                                onclick={() => deleteMemberClick(league.id, league.currentUser.memberId)}
                                                    class={buttonVariants({
                                                        variant: 'ghost',
                                                        size: 'icon'
                                                    })}
                                                >
                                                    <Icon
                                                        id="memberLeavemBtn"
                                                        icon='line-md:account-delete'
                                                        class='text-red-600'
                                                    />
                                                    <span class="sr-only">Leave</span>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content><p>Leave</p></Tooltip.Content>
                                            </Tooltip.Root>
                                        </Tooltip.Provider>
                                    {/if}
                                </span>    
                            </Table.Cell>
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
                            </span>
                        </Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
        </Card.Content>
    </Card.Root>
</div>
