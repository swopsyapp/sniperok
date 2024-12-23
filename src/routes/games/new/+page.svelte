<script lang="ts">
    import { getFlash } from 'sveltekit-flash-message';
    
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    import * as Card from '$lib/components/ui/card/index';
    import { Checkbox } from '$lib/components/ui/checkbox';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';

    import { logger } from '$lib/logger';
    import { HttpStatus } from '$lib/utils';

    const flash = getFlash(page);

    let isPublic : boolean = $state(true);
    let minPlayers : number = $state(2);
    let startSeconds : number = $state(60);

    async function newGame(event : SubmitEvent) {
        event.preventDefault();
        const response = await fetch($page.url.href, {
            method: 'POST',
            body: JSON.stringify({
                isPublic: isPublic,
                minPlayers: minPlayers,
                startSeconds: startSeconds
            })
        });

        logger.trace('response.status : ', response.status);

        const json = await response.json();
        logger.trace('json : ', json);

        if (response.status == HttpStatus.OK) {
            goto('/games', {
                replaceState: true,
                invalidateAll: true
            } );
        } else {
            $flash = { type: 'error', message: 'Nope!' };
            return;
        }
    }

</script>

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-4xl font-thin">New Game</Card.Title>
            <!-- <Card.Description>Welcome</Card.Description> -->
        </Card.Header>
        <Card.Content>
            <form method="POST" onsubmit={(e) => { newGame(e) }}>
                <span class="flex w-full">
                    <Label
                        id="isPublic-label"
                        for="isPublic"
                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 w-3/5"
                    >
                        is public
                    </Label>
                    <Checkbox id="isPublic" bind:checked={isPublic} aria-labelledby="isPublic-label" />
                </span>
                <br/>
                <span class="flex w-full">
                    <Label
                        id="minPlayers-label"
                        for="minPlayers"
                        class="w-3/5 pt-3">
                        Min players
                    </Label>
                    <Input id="minPlayers" bind:value={minPlayers} type="number" min="2" max="12"/>
                </span>
                <br/>
                <span class="flex w-full">
                    <Label
                        id="startSeconds-label"
                        for="startSeconds"
                        class="w-3/5 pt-3">
                        Seconds before start
                    </Label>
                    <Input id="startSeconds" bind:value={startSeconds} type="number" min="10" max="600"/>
                </span>
            </form>    
        </Card.Content>
    </Card.Root>
</div>
