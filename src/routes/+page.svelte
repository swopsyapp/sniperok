<script lang="ts">
    import * as Card from '$lib/components/ui/card/index';
    import { Button } from '$lib/components/ui/button';
    import Icon from '@iconify/svelte';

    let { userProfile } = $props();

	// export let data;
    // let userProfile = $state(data.userProfile);

	// let avatar: string;

	// Reactive statement to update avatar when data changes
	// $: userProfile = data?.userProfile || '';
	// $: avatar = data?.user?.user_metadata?.avatar_url || '';
</script>

<div>
    <Card.Root class="mx-auto max-w-md">
        <Card.Header>
            <Card.Title class="text-4xl font-thin text-center">
                Welcome to Junowot
            </Card.Title>
            <!-- <Card.Description>Welcome</Card.Description> -->
        </Card.Header>
        <Card.Content>
            {#if userProfile == null}
                <Button class="group/loginButton w-full" disabled={true}>
                    <div class="flex items-center gap-2">
                        <Icon
                            icon="mdi:add-bold"
                            class="h-5 w-5 transition-all duration-300 md:group-hover/loginButton:translate-x-1"
                        />
                        <div>Create game</div>
                    </div>
                </Button>
            {:else}
                <Button href="/auth/login" class="group/loginButton w-full">
                    <div class="flex items-center gap-2">
                        <Icon
                            icon="mdi:add-bold"
                            class="h-5 w-5 transition-all duration-300 md:group-hover/loginButton:translate-x-1"
                        />
                        <div>Create game</div>
                    </div>
                </Button>
            {/if}
            <br>
            <br>
            <Button href="/auth/login" class="group/loginButton w-full">
                <div class="flex items-center gap-2">
                    <Icon
                        icon="mdi:format-list-checkbox"
                        class="h-5 w-5 transition-all duration-300 md:group-hover/loginButton:translate-x-1"
                    />
                    <div>List Games</div>
                </div>
            </Button>
        </Card.Content>
    </Card.Root>
</div>
