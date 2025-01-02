<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { io } from 'socket.io-client';
    import Icon from '@iconify/svelte';

    import { page } from '$app/stores';
    import { logger } from '$lib/logger';
    import * as Card from '$lib/components/ui/card/index';

    import Input from './ui/input/input.svelte';
    import { Button } from './ui/button';
    import { clientMessageHandler, type ActionableMessage } from './messages.svelte';

    let user = $page.data.user;
    let username = user?.user_metadata.username ?? 'Guest';

    let activeTab: string = $state('worldChat');
    let msgText: string = $state('');
    let messages = $derived(clientMessageHandler.getMessages(activeTab));

    function isSendDisabled() : boolean {
        return username == 'Guest' ? true : false;
    }

    function getTabVariant(tabName: string) {
        return tabName == activeTab ? 'default' : 'outline';
    }

    function getTabtextColor(tabName: string) {
        return tabName == activeTab ? '' : 'text-gray-500';
    }

    function selectMessageTab(tabName: string) {
        activeTab = tabName;
    }

    function sendWorldChatMessage() {
        clientMessageHandler.sendWorldMessage(username, msgText);
        msgText = '';
    }
</script>

{#snippet messageTab(tabName: string, icon: string)}
    <Button
        onclick={() => {
            selectMessageTab(tabName);
        }}
        variant={getTabVariant(tabName)}
        class={getTabtextColor(tabName)}
    >
        <Icon {icon} class="h-[1.2rem] w-[1.2rem] scale-100" />
    </Button>
{/snippet}

{#snippet messageItem(message: ActionableMessage)}
    <li>@{message.sender}
        {#if (username != 'Guest' && message.actions && message.actions.length > 0)}
            [
            {#each message.actions as action}
                <a href={action.url} class={action.promptClass}>{action.prompt}</a>
            {/each}
            ]
        {/if}: {message.text}
    </li>
{/snippet}

<Card.Root class="mx-auto h-full max-w-md">
    <Card.Header>
        <Card.Title class="text-center text-4xl font-thin">Messages</Card.Title>
    </Card.Header>
    <Card.Content class="flex h-5/6 flex-col">
        <div class="grid grid-cols-3 gap-1">
            {@render messageTab('worldChat', 'lucide:globe')}
            {@render messageTab('userChat', 'lucide:user-round')}
            {@render messageTab('gameChat', 'icon-park-outline:three')}
        </div>
        <div class="flex-grow">
            <ul>
                {#each messages as msg}
                    {@render messageItem(msg)}
                {/each}
            </ul>
        </div>
        <div class="pb-1">
            <span class="flex gap-1">
                <Input disabled={isSendDisabled()} bind:value={msgText} autocomplete="off" />
                <Button disabled={isSendDisabled()}
                    onclick={sendWorldChatMessage}>Send</Button
                >
            </span>
        </div>
    </Card.Content>
</Card.Root>
