<script lang="ts">
    import { getFlash } from 'sveltekit-flash-message';
    import Icon from '@iconify/svelte';

    import { page } from '$app/stores';
    import { invalidateAll } from '$app/navigation';

    import { logger } from '$lib/logger';
    import { HttpStatus } from '$lib/utils';
    import { Status } from '$lib/model/status.d';
    import * as Card from '$lib/components/ui/card/index';
    import * as Table from '$lib/components/ui/table/index';
    import * as Tooltip from '$lib/components/ui/tooltip/index';
    import { Input } from '$lib/components/ui/input';
    import { Button, buttonVariants } from '$lib/components/ui/button';

    import type { PageData } from './$types';

    const hourglassNotDone = '\u23F3';
    const flash = getFlash(page);

    let { data }: { data: PageData } = $props();
    const buddies = $derived(data.buddies);

    let buddyName: string = $state('');

    async function addBuddy() {
        if ( !buddyName || buddyName.trim().length == 0) {
            $flash = { type: 'error', message: 'Buddy name cannot be empty' };
            buddyName = '';
            return;
        }

        logger.trace('Adding buddy : ', buddyName);

        const response = await fetch($page.url.href, {
            method: 'POST',
            body: JSON.stringify({
                buddyName: buddyName
            })
        });

        logger.trace('response.status : ', response.status);

        const json = await response.json();
        logger.trace('json : ', json);

        if (response.status == HttpStatus.OK) {
            $flash = { type: 'success', message: 'Request sent' };
            buddyName = '';
            invalidateAll();
        } else if (response.status == HttpStatus.NOT_FOUND) {
            $flash = { type: 'error', message: 'Buddy not found' };
        } else if (response.status == HttpStatus.CONFLICT) {
            $flash = { type: 'error', message: 'Buddy already exists' };
        } else if (response.status == HttpStatus.NOT_ACCEPTABLE) {
            $flash = { type: 'error', message: 'Cannot buddy yourself' };
        } else {
            $flash = { type: 'error', message: 'Nope!' };
        }
    }

    async function confirmBuddy(player: string, buddy: string) {}

    async function deleteBuddy(player: string, buddy: string) {
        const response = await fetch($page.url.href + '/service', {
            method: 'DELETE',
            body: JSON.stringify({
                playerName: player,
                buddyName: buddy
            })
        });

        logger.trace('response.status : ', response.status);

        const json = await response.json();
        logger.trace('json : ', json);

        if (response.status == HttpStatus.OK) {
            $flash = { type: 'success', message: 'Request sent' };
            buddyName = '';
            invalidateAll();
        } else if (response.status == HttpStatus.NOT_FOUND) {
            $flash = { type: 'error', message: 'Buddy not found' };
        } else if (response.status == HttpStatus.FORBIDDEN) {
            $flash = { type: 'error', message: 'Unauthorized' };
        } else {
            $flash = { type: 'error', message: 'Nope!' };
        }
    }
</script>

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-4xl font-thin">Buddies</Card.Title>
        </Card.Header>
        <Card.Content>
            <div class="pb-1">
                <span class="flex gap-1">
                    <Input bind:value={buddyName} placeholder="Buddy name" autocomplete="off" />
                    <Button onclick={addBuddy}>
                        <Icon icon="mdi:user-add-outline" />Add
                    </Button>
                </span>
            </div>    
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Name</Table.Head>
                        <Table.Head class="w-28 text-right">Action</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each buddies as buddyRecord}
                        <Table.Row>
                            <Table.Cell class="font-medium">
                                {buddyRecord.counterparty}
                                <!-- If record is pending and invitor is viewing the list -->
                                {#if buddyRecord.status == Status.pending && buddyRecord.buddy == buddyRecord.counterparty }
                                    &nbsp;...&nbsp;{hourglassNotDone}
                                {/if}
                            </Table.Cell>
                            <Table.Cell class="font-medium">
                                <span class="flex">
                                    <!-- If record is pending and invitee is viewing the list -->
                                    {#if buddyRecord.status == Status.pending && buddyRecord.player == buddyRecord.counterparty }
                                        <Tooltip.Provider>
                                            <Tooltip.Root>
                                                <Tooltip.Trigger
                                                    onclick={() => confirmBuddy(buddyRecord.player, buddyRecord.buddy)}
                                                    class={buttonVariants({
                                                        variant: 'ghost',
                                                        size: 'icon'
                                                    })}
                                                >
                                                    <Icon
                                                        icon="line-md:confirm"
                                                        class="text-green-600"
                                                    />
                                                    <span class="sr-only">Confirm</span>
                                                </Tooltip.Trigger>
                                                <Tooltip.Content><p>Confirm</p></Tooltip.Content>
                                            </Tooltip.Root>
                                        </Tooltip.Provider>
                                    {/if}
                                    <Tooltip.Provider>
                                        <Tooltip.Root>
                                            <Tooltip.Trigger
                                                onclick={() => deleteBuddy(buddyRecord.player, buddyRecord.buddy)}
                                                class={buttonVariants({
                                                    variant: 'ghost',
                                                    size: 'icon'
                                                })}
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
                                </span>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>

            {#if buddies.length == 0}
                <center>
                    <br />
                    <span>Nobby No-mates</span>    
                </center>
            {/if}
        </Card.Content>
    </Card.Root>
</div>
