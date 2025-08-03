<script lang="ts">
    import * as Card from '$lib/components/ui/card/index';
    import * as Table from '$lib/components/ui/table/index';
    import Icon from '@iconify/svelte';

    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    const boosts = $derived(data.boosts);
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
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each boosts as boost}
                        <Table.Row>
                            <Table.Cell class="font-medium">{boost.boostType}
                            </Table.Cell>
                            <Table.Cell class="font-medium pb-10">
                                <span class="ml-2">
                                    <Icon
                                        icon={boost.icon ?? ''}
                                        class="h-6 w-6 text-gray-200"
                                    />
                                </span>

                            </Table.Cell>

                            <Table.Cell class="text-right font-medium">{boost.quantity}</Table.Cell>
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
