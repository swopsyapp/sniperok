<script lang="ts">
    import * as Table from '$lib/components/ui/table/index';
    import type { GameSummary } from '$lib/model/model.d';

    let { summary }: { summary: GameSummary[] } = $props();
</script>

<Table.Root class="w-full">
    <Table.Header>
        <Table.Row>
            <Table.Head class="px-1">Player</Table.Head>
            <Table.Head class="px-1">Total Wins</Table.Head>
        </Table.Row>
    </Table.Header>
    <Table.Body>
        {#each summary as playerSummary}
            <Table.Row>
                <Table.Cell class="px-1 font-medium">{playerSummary.username}</Table.Cell>
                <Table.Cell class="px-1 font-medium">{playerSummary.total_wins}</Table.Cell>
            </Table.Row>
        {/each}
    </Table.Body>
</Table.Root>
