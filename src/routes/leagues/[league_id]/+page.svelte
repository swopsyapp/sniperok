<script lang="ts">
    import Icon from '@iconify/svelte';
    import { getFlash } from 'sveltekit-flash-message';

    import { invalidateAll } from '$app/navigation';
    import { page } from '$app/stores';
    import { logger } from '$lib/logger';
    import { HttpStatus } from '$lib/utils';
    import { buttonVariants } from '$lib/components/ui/button';
    import * as Card from '$lib/components/ui/card/index';
    import { Checkbox } from '$lib/components/ui/checkbox/index';
    import { Input } from '$lib/components/ui/input';
    import * as Table from '$lib/components/ui/table/index';
    import * as Tooltip from '$lib/components/ui/tooltip/index.js';

    import type { PageData } from './$types.js';
    
    const flash = getFlash(page);

    let { data }: { data: PageData } = $props();

    const leagueId = $derived(data.league.id);
    var leagueName = $state(data.league.name);
    const members = $derived(data.league.members);

    const readOnlyInputClass = 'text-muted-foreground aria-readonly';
    let isNameChange = $state(false);
    let renameInputClass = $derived(isNameChange ? '' : readOnlyInputClass);
    let renameButtonIcon = $derived(
        isNameChange
            ? 'line-md:u-turn-left'
            : 'line-md:edit'
    );
    let renameIconClass = $derived(
        !data.league.currentUser.isCurator ?
            'h-6 w-6 rotate-0 scale-100 text-gray-400'
            :
            isNameChange ?
                'h-6 w-6 rotate-0 scale-100 text-red-600'
                :
                'h-6 w-6 rotate-0 scale-100 text-green-600'
    );
    let renameToolTip = $derived(
        isNameChange
            ? 'Cancel'
            : 'Rename'
    );
    
    let confirmNameClass = $derived(
        isNameChange
            ? 'h-6 w-6 rotate-0 scale-100 text-green-600'
            : 'h-6 w-6 rotate-0 scale-100 text-gray-400'
    );

    let isAdding = $state(false);
    let newUsername = $state('');
    let usernameInputClass = $derived(isAdding ? '' : readOnlyInputClass);
    let addMemberIcon = $derived(
        isAdding
            ? 'line-md:u-turn-left'
            : 'line-md:plus-square'
    );
    let addMemberClass = $derived(
        isAdding
            ? 'h-6 w-6 rotate-0 scale-100 text-red-600'
            : 'h-6 w-6 rotate-0 scale-100 text-green-600'
    );
    let addMemberToolTip = $derived(
        isAdding
            ? 'Cancel'
            : 'New'
    );
    let confirmMemberClass = $derived(
        isAdding
            ? 'h-6 w-6 rotate-0 scale-100 text-green-600'
            : 'h-6 w-6 rotate-0 scale-100 text-gray-400'
    );


    async function changeNameClick() {
        if ( !data.league.currentUser.isCurator ) {
            // Button should be disabled
            return;
        }

        isNameChange = !isNameChange;

        if (document) {
            const inputElem = document.getElementById('leagueNameInput');
            const buttonElem = document.getElementById('changeNameBtn');
            if (isNameChange) {
                inputElem?.focus();
            } else {
                logger.trace('cancelling');
                buttonElem?.focus();
                await invalidateAll().then(() => {
                    leagueName = data.league.name
                });
            }
        }
    }

    async function confirmNameClick() {
        if (!isNameChange) {
            // button should be disabled
            return;
        }

        const newLeagueName = leagueName.trim();
        if (newLeagueName == '') {
            $flash = { type: 'error', message: 'League name cannot be blank' };
            return;
        }

        const leagueUrl = encodeURI($page.url.href.concat(`/[${leagueId}]?name=${newLeagueName}`));
        const response = await fetch($page.url.href, {
            method: "PATCH",
            body: JSON.stringify({ name: newLeagueName })
        });

        const json = await response.json();
        logger.trace('json : ', json);

        if (response.status == HttpStatus.NOT_ACCEPTABLE) {
            const msg = 'League name cannot be blank';
            $flash = { type: 'error', message: msg };
            return;
        }

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

        changeNameClick();
        
        $flash = { type: 'success', message: `League updated : ${leagueName}` };
    }

    async function deleteMemberClick(memberId : string) {
        logger.trace("deleting memberId : ", memberId);

        const memberUrl = $page.url.href.concat(`/[${memberId}]`);
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

        $flash = { type: 'success', message: `Member deleted` };

        invalidateAll();
    }

    function addMemberClick() {
        isAdding = !isAdding;

        if (document) {
            const inputElem = document.getElementById('usernameInput');
            const buttonElem = document.getElementById('memberAddBtn');
            if (isAdding) {
                inputElem?.focus();
            } else {
                newUsername = '';
                // Clear any previous flash message
                $flash = undefined;
                buttonElem?.focus();
            }
        }
    }

    async function confirmMemberClick() {
        if (!isAdding) {
            // button should be disabled
            return;
        }

        newUsername = newUsername.trim();
        if (newUsername == '') {
            $flash = { type: 'error', message: 'Member username name cannot be blank' };
            return;
        }

        const newCuratorCheckElem = document.getElementById('newCuratorCheck');
        // logger.trace('newCuratorCheckElem : ', newCuratorCheckElem);
        const newCuratorCheck = (newCuratorCheckElem?.attributes.getNamedItem('data-state')?.value == 'checked') ? true : false;

        // const newLeagueUrl = encodeURI($page.url.href.concat('/[addMember]'));
        const newLeagueUrl = $page.url.href.concat('/[addMember]');
        const response = await fetch(newLeagueUrl, {
            method: "POST",
            body: JSON.stringify({
                username: newUsername,
                isCurator: newCuratorCheck
            })
        });

        const json = await response.json();
        logger.trace('json : ', json);

        if (response.status == HttpStatus.NOT_FOUND) {
            const msg = 'User not found';
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

        addMemberClick();
        invalidateAll();
    }

</script>

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-4xl font-thin text-nowrap">League</Card.Title>
            <!-- <Card.Description>Welcome</Card.Description> -->
        </Card.Header>
        <Card.Content>
            <span class="flex justify-end">
                <Input
                    id="leagueNameInput"
                    bind:value={leagueName}
                    placeholder="-"
                    readonly={!isNameChange}
                    class={renameInputClass}
                />
                <span class="pl-2 flex justify-end space-x-2">
                    <Tooltip.Provider>
                        <Tooltip.Root>
                            <Tooltip.Trigger
                                onclick={() => confirmNameClick()}
                                class={buttonVariants({
                                    variant: 'ghost',
                                    size: 'icon'
                                })}
                            >
                                <Icon
                                    id="leagueConfirmBtn"
                                    icon="line-md:confirm"
                                    class={confirmNameClass}
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
                                onclick={() => changeNameClick()}
                                class={buttonVariants({
                                    variant: 'ghost',
                                    size: 'icon'
                                })}
                            >
                                <Icon
                                    id="changeNameBtn"
                                    icon={renameButtonIcon}
                                    class={renameIconClass}
                                />
                                <span class="sr-only">{renameToolTip}</span>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                                <p>{renameToolTip}</p>
                            </Tooltip.Content>
                        </Tooltip.Root>
                    </Tooltip.Provider>
                </span>
            </span>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>User Name</Table.Head>
                        <Table.Head>Status</Table.Head>
                        <Table.Head>Is Curator</Table.Head>
                        <Table.Head class="w-28 text-right">Action</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each members as member}
                        <Table.Row>
                            <Table.Cell class="font-medium">{member.username}</Table.Cell>
                            <Table.Cell class="font-medium">{member.status_code}</Table.Cell>
                            <Table.Cell class="font-medium">
                                {#if member.is_curator}
                                    <Checkbox checked />
                                {:else}
                                    <Checkbox />
                                {/if}
                            </Table.Cell>
                            <Table.Cell>
                                <span class="flex">
                                    {#if data.league.currentUser.isCurator}
                                        <Tooltip.Provider>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger
                                                    class={buttonVariants({
                                                        variant: 'ghost',
                                                        size: 'icon'
                                                    })}
                                                >
                                                    <Icon
                                                        id="leagueEditBtn"
                                                        icon='line-md:edit'
                                                        class='text-green-600'
                                                    />
                                                <span class="sr-only">Edit</span>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content><p>Edit</p></Tooltip.Content>
                                            </Tooltip.Root>
                                        </Tooltip.Provider>
                                        {#if members.length > 1}
                                            <Tooltip.Provider>
                                                <Tooltip.Root>
                                                    <Tooltip.Trigger
                                                        onclick={() => deleteMemberClick(member.league_member_id)}
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
                                    {/if}
                                </span>    
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                    <Table.Row>
                        <Table.Cell class="font-medium">
                            <Input
                                id="usernameInput"
                                bind:value={newUsername}
                                placeholder="-"
                                readonly={!isAdding}
                                class={usernameInputClass}
                            />
                        </Table.Cell>
                        <Table.Cell class="font-medium">
                            <Input
                                placeholder="pending"
                                readonly={true}
                                class={readOnlyInputClass}
                            />
                        </Table.Cell>
                        <Table.Cell class="font-medium">
                            {#if (isAdding)}
                                <Checkbox id="newCuratorCheck" />
                            {:else}
                                <Checkbox id="newCuratorCheck" disabled />
                            {/if}
                        </Table.Cell>
                        <Table.Cell class="object-right text-right">
                            <span class="flex justify-end space-x-2">
                                <Tooltip.Provider>
                                    <Tooltip.Root>
                                        <Tooltip.Trigger
                                            onclick={() => confirmMemberClick()}
                                            class={buttonVariants({
                                                variant: 'ghost',
                                                size: 'icon'
                                            })}
                                        >
                                            <Icon
                                                id="memberConfirmBtn"
                                                icon="line-md:confirm"
                                                class={confirmMemberClass}
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
                                            onclick={() => addMemberClick()}
                                            class={buttonVariants({
                                                variant: 'ghost',
                                                size: 'icon'
                                            })}
                                        >
                                            <Icon
                                                id="memberAddBtn"
                                                icon={addMemberIcon}
                                                class={addMemberClass}
                                            />
                                            <span class="sr-only">{addMemberToolTip}</span>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content>
                                            <p>{addMemberToolTip}</p>
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
