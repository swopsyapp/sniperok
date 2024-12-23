<script lang="ts">
    import * as Card from '$lib/components/ui/card/index';
    import * as Table from '$lib/components/ui/table/index';

    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    const games = $derived(data.games);

</script>

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-4xl font-thin">List of Games</Card.Title>
            <!-- <Card.Description>Welcome</Card.Description> -->
        </Card.Header>
        <Card.Content>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Status</Table.Head>
                        <Table.Head>Players</Table.Head>
                        <Table.Head>Rounds</Table.Head>
                        <Table.Head class="w-28 text-right">Action</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each games as game}
                        <Table.Row>
                            <Table.Cell class="font-medium">{game.status}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell class="font-medium">{game.players} / {game.minPlayers}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell class="font-medium">{game.rounds}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell class="font-medium">join</Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>

        </Card.Content>
    </Card.Root>
</div>
