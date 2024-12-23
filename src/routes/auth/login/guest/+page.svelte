<script lang="ts">
    import { onMount } from 'svelte';
    import { getFlash } from 'sveltekit-flash-message';

    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    import { logger } from '$lib/logger';
    import { HttpStatus } from '$lib/utils';

    import * as Card from '$lib/components/ui/card/index';
    import { Label } from '$lib/components/ui/label';
    import { Input } from '$lib/components/ui/input';

    import type { PageData } from './$types.js';

    const flash = getFlash(page);

    let { data }: { data: PageData } = $props();

    let answer : string = $state('');

	onMount(() => {
        document.getElementById("answer")?.focus();
	});

    async function challenge(event : SubmitEvent) {
        event.preventDefault();
        const response = await fetch($page.url.href.concat('?answer=', answer), {
            method: 'POST',
            body: JSON.stringify({
                answer: answer
            })
        });

        logger.trace('response.status : ', response.status);

        const json = await response.json();
        logger.trace('json : ', json);

        if (response.status == HttpStatus.OK) {
            goto('/', {
                replaceState: true,
                invalidateAll: true
            } );
        } else {
            $flash = { type: 'error', message: 'Nope!' };
            return;
        }
    }

</script>

<Card.Root class="mx-auto max-w-md">
    <Card.Header>
        <Card.Title class="text-3xl font-thin">Guest</Card.Title>
        <Card.Description>Type the answer and press enter</Card.Description>
    </Card.Header>
    <Card.Content>
        <form method="POST" onsubmit={(e) => { challenge(e) }}>
            <span class="flex w-full justify-center items-center">
                <Label class="pr-4">
                    two plus three equals :
                </Label>
                <Input
                    id="answer"
                    name="answer"
                    bind:value={answer}
                    autocomplete="off"
                    class="w-1/3" />
            </span>
        </form>
    </Card.Content>
</Card.Root>
