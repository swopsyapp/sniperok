<script lang="ts">
    import { getFlash } from 'sveltekit-flash-message';
    import * as Card from '$lib/components/ui/card/index';
    import * as Table from '$lib/components/ui/table/index';
    import Icon from '@iconify/svelte';

    import * as Tooltip from '$lib/components/ui/tooltip/index';
    import { buttonVariants } from '$lib/components/ui/button';

    import { Boost } from '$lib/model/model.d';
    import { logger } from '$lib/logger';
    import { HttpStatus } from '$lib/utils';

    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    const boosts = $derived(data.boosts);
    const snapsBoost = $derived(
        data.boosts.find((b) => b.boostType === 'snaps') ?? {
            boostType: 'snaps',
            quantity: 0,
            icon: 'streamline-flex:finger-snapping'
        }
    );

    const iconGhost = buttonVariants({ variant: 'ghost', size: 'icon' });
    const flash = getFlash(page);

    async function buyBoost(boostType: string) {
        if (!data.user) {
            $flash = { type: 'error', message: 'User not logged in' };
            return;
        }
        if (!boostType) {
            $flash = { type: 'error', message: 'Invalid boost type : ' + boostType };
            return;
        }
        const tradeBoostUrl = `/games/[${boostType}]`;
        const response = await fetch(tradeBoostUrl, {
            method: 'POST'
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
            const errMsg = 'Not enough snaps';
            logger.warn(errMsg);
            $flash = { type: 'error', message: errMsg };
            return;
        }

        if (response.status != HttpStatus.OK) {
            logger.error('error status : ', response.status, response.url);
            $flash = { type: 'error', message: 'An error occurred' };
            return;
        }

        const json = await response.json();
        logger.debug('buyBoost response.json : ', json);

        $flash = { type: 'success', message: 'Bought ' + boostType };
    }

    async function sellBoost(boostType: string) {
        if (!data.user) {
            $flash = { type: 'error', message: 'User not logged in' };
            return;
        }
        if (!boostType) {
            $flash = { type: 'error', message: 'Invalid boost type : ' + boostType };
            return;
        }
        const tradeBoostUrl = `/games/[${boostType}]`;
        const response = await fetch(tradeBoostUrl, {
            method: 'DELETE'
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
            const errMsg = 'Not enough snaps';
            logger.warn(errMsg);
            $flash = { type: 'error', message: errMsg };
            return;
        }

        if (response.status != HttpStatus.OK) {
            logger.error('error status : ', response.status, response.url);
            $flash = { type: 'error', message: 'An error occurred' };
            return;
        }

        const json = await response.json();
        logger.debug('buyBoost response.json : ', json);

        $flash = { type: 'success', message: 'Sold ' + boostType };
    }
</script>

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-4xl font-thin">Boosts</Card.Title>
        </Card.Header>
        <Card.Content>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Boost Type</Table.Head>
                        <Table.Head>&nbsp;</Table.Head>
                        <Table.Head class="text-right">Quantity</Table.Head>
                        <Table.Head>&nbsp;</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each boosts as boost}
                        <Table.Row>
                            <Table.Cell class="font-medium">{boost.boostType}</Table.Cell>
                            <Table.Cell class="pb-10 font-medium">
                                <span class="ml-2">
                                    <Icon icon={boost.icon ?? ''} class="h-6 w-6 text-gray-200" />
                                </span>
                            </Table.Cell>

                            <Table.Cell class="text-right font-medium">{boost.quantity}</Table.Cell>
                            <Table.Cell class="font-medium">
                                {#if boost.boostType == 'snaps'}
                                    &nbsp;
                                {:else}
                                    <Tooltip.Provider>
                                        <Tooltip.Root>
                                            <Tooltip.Trigger
                                                disabled={(snapsBoost.quantity ?? 0) <
                                                    Boost.BOOST_BUY_PRICE}
                                                onclick={() =>
                                                    buyBoost(boost.boostType ?? 'unknown')}
                                                class={iconGhost}
                                            >
                                                <Icon icon="gg:add-r" class="text-green-600" /><sup
                                                    class="text-gray-400"
                                                    >{Boost.BOOST_BUY_PRICE}</sup
                                                >
                                                <span class="sr-only">Buy</span>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content>
                                                <p>
                                                    Buy <sup class="text-gray-400"
                                                        >{boost.boostType}</sup
                                                    >
                                                </p>
                                            </Tooltip.Content>
                                        </Tooltip.Root>
                                    </Tooltip.Provider>
                                    <Tooltip.Provider>
                                        <Tooltip.Root>
                                            <Tooltip.Trigger
                                                disabled={(boost.quantity ?? 0) < 1}
                                                onclick={() =>
                                                    sellBoost(boost.boostType ?? 'unknown')}
                                                class={iconGhost}
                                            >
                                                <Icon icon="gg:remove-r" class="text-red-600" /><sup
                                                    class="text-gray-400"
                                                    >{Boost.BOOST_SELL_PRICE}</sup
                                                >
                                                <span class="sr-only">Sell</span>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content>
                                                <p>
                                                    Sell <sup class="text-gray-400"
                                                        >{boost.boostType}</sup
                                                    >
                                                </p>
                                            </Tooltip.Content>
                                        </Tooltip.Root>
                                    </Tooltip.Provider>
                                {/if}
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>

            {#if boosts.length == 0}
                <center>
                    <br />
                    <span>No boosts found.</span>
                </center>
            {/if}
        </Card.Content>
    </Card.Root>
</div>
