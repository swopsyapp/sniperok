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

    let isNameChange = $state(false);
    let nameChangeClass = $derived(isNameChange ? '' : 'text-muted-foreground aria-readonly');
    let renameButtonIcon = $derived(
        isNameChange
            ? 'line-md:u-turn-left'
            : 'line-md:edit'
    );
    let addClass = $derived(
        isNameChange
            ? 'h-6 w-6 rotate-0 scale-100 text-red-600'
            : 'h-6 w-6 rotate-0 scale-100 text-green-600'
    );
    let addToolTip = $derived(
        isNameChange
            ? 'Cancel'
            : 'New'
    );
    
    let confirmNameClass = $derived(
        isNameChange
            ? 'h-6 w-6 rotate-0 scale-100 text-green-600'
            : 'h-6 w-6 rotate-0 scale-100 text-gray-400'
    );

    async function changeNameClick() {
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

    async function deleteClick(memberId : string) {
        logger.trace("deleting memberId : ", memberId);

        const memberUrl = $page.url.origin.concat(`/league_members/[${memberId}]`);
        const response = await fetch(memberUrl, {
            method: "DELETE",
        });

        $flash = { type: 'success', message: `Member deleted` };

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
                    class={nameChangeClass}
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
                                    {#if data.league.isCurator}
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
                                                        onclick={() => deleteClick(member.league_member_id)}
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
                    <!--
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
                    -->
                </Table.Body>
            </Table.Root>
        </Card.Content>
    </Card.Root>
</div>
