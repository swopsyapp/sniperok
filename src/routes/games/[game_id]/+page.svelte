<script lang="ts">
    import * as Card from '$lib/components/ui/card/index';

    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<Card.Root class="mx-auto max-w-md">
    <Card.Header>
        <Card.Title class="w-10/12 text-center text-4xl font-thin">Game</Card.Title>                
    </Card.Header>
    <Card.Content>
        fun goes here
    </Card.Content>
</Card.Root>
