<script lang="ts">
    import Icon from '@iconify/svelte';
    import { page } from '$app/stores';
    import * as Card from '$lib/components/ui/card/index';
    import { Button } from '$lib/components/ui/button';

    let user = $page.data.user;

</script>

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-center text-4xl font-thin">Welcome to Junowot</Card.Title>
            <!-- <Card.Description>Welcome</Card.Description> -->
        </Card.Header>
        <Card.Content>
            <Button href="/games" class="w-full">
                <div class="flex items-center gap-2">
                    <Icon
                        icon="mdi:format-list-checkbox"
                        class="h-5 w-5 transition-all duration-300 md:group-hover/loginButton:translate-x-1"
                    />
                    <span>List Games</span>
                </div>
            </Button>
            <br />
            <br />
            {#if user == null}
                <Button class="w-full" disabled={true}>
                    <div class="flex items-center gap-2">
                        <Icon
                            icon="mdi:add-bold"
                            class="h-5 w-5 transition-all duration-300 md:group-hover/loginButton:translate-x-1"
                        />
                        <span>Create game</span>
                    </div>
                </Button>
                <br />
                <br />
                <Button class="w-full" disabled={true}>
                    <div class="flex items-center gap-2">
                        <Icon
                            icon="mdi:users-group-outline"
                            class="h-5 w-5 transition-all duration-300 md:group-hover/loginButton:translate-x-1"
                        />
                        <span>Leagues</span>
                    </div>
                </Button>
            {:else}
                <Button href="/auth/login" class="w-full">
                    <div class="flex items-center gap-2">
                        <Icon
                            icon="mdi:add-bold"
                            class="h-5 w-5 transition-all duration-300 md:group-hover/loginButton:translate-x-1"
                        />
                        <span>Create game</span>
                    </div>
                </Button>
                <br />
                <br />
                <Button href="/leagues" class="w-full">
                    <div class="flex items-center gap-2">
                        <Icon
                            icon="mdi:users-group-outline"
                            class="h-5 w-5 transition-all duration-300 md:group-hover/loginButton:translate-x-1"
                        />
                        <span>Leagues</span>
                    </div>
                </Button>
            {/if}
            <br />
            <br />
        </Card.Content>
    </Card.Root>
</div>
