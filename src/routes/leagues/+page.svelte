<script lang="ts">
    import * as Card from '$lib/components/ui/card/index';
    import { logger } from '$lib/logger';
    import type { PageData } from './$types.js';

    export let data: PageData;
    const leagues = data.leagues;

    logger.debug("leagues : ", leagues);
</script>

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-4xl font-thin">Leagues</Card.Title>
            <!-- <Card.Description>Welcome</Card.Description> -->
        </Card.Header>
        <Card.Content>
            <ul>
                {#each leagues as league}
                    <li>{league.name}</li>
                {/each}
            </ul>
        </Card.Content>
    </Card.Root>
</div>
