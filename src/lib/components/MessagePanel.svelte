<script lang="ts">
    import { onMount } from 'svelte';
    import Icon from '@iconify/svelte';

    import { page } from '$app/stores';
    import { logger } from '$lib/logger';
    import * as Card from '$lib/components/ui/card/index';

    import Input from './ui/input/input.svelte';
    import { Button } from './ui/button';
    import { clientMessageHandler, type ActionableMessage } from './messages.svelte';

    const GUEST = 'Guest';
    let user = $page.data.user;
    let username = user?.user_metadata.username ?? GUEST;

    logger.trace('route = ', $page.route.id);
    logger.trace($page.data);
    
    let activeTab: string = $state($page.route.id == '/games/[game_id]' ? 'gameChat' : 'worldChat');
    let msgText: string = $state('');
    let messageList = $derived(clientMessageHandler.getMessages(activeTab));
    let isSendBlocked: boolean = $state(getSendBlocked());

    let worldMessages = $state(clientMessageHandler.getWorldMessages());
    let userMessages = $state(clientMessageHandler.getUserMessages());
    let gameMessages = $state(clientMessageHandler.getGameMessages());

    let worldMsgCountPrev = worldMessages.length;
    let worldMsgCount = $derived(worldMessages.length);
    let worldMsgUnseen = $state(false);

    let userMsgCountPrev = userMessages.length;
    let userMsgCount = $derived(userMessages.length);
    let userMsgUnseen = $state(false);

    let gameMsgCountPrev = gameMessages.length;
    let gameMsgCount = $derived(gameMessages.length);
    let gameMsgUnseen = $state(false);

    let unseenMap = $derived.by(() => {
        let map : { [key: string]: boolean} = {
            worldChat: worldMsgUnseen,
            userChat: userMsgUnseen
        };
        
        return map;
    });

    $effect(() => {
        if (activeTab == 'worldChat') {
            worldMsgCountPrev = worldMsgCount;
        }
        worldMsgUnseen = (worldMsgCountPrev != worldMsgCount);

        if (activeTab == 'userChat') {
            userMsgCountPrev = userMsgCount;
        }
        userMsgUnseen = (userMsgCountPrev != userMsgCount);

        if (activeTab == 'gameChat') {
            gameMsgCountPrev = gameMsgCount;
        }
        gameMsgUnseen = (gameMsgCountPrev != gameMsgCount);
    });

    onMount(() => {
        clientMessageHandler.connect();
    })

    function getSendBlocked() : boolean {
        let isBlocked = true;
        if (user) {
            if (username == GUEST) {
                if (activeTab == 'gameChat' && $page.route.id == '/games/[game_id]') {
                    logger.trace('send enabled, Guest in game on gameChat tab ', activeTab);
                    isBlocked = false;
                } else {
                    logger.trace('send disabled, Guest not in game or not on gameChat tab ', activeTab, $page.route.id);
                }
            } else {
                logger.trace('send enabled, user not Guest', username);
                isBlocked = false;
            }
        } else {
            logger.trace('send disabled, no user');
        }
        return isBlocked;
    }

    function getTabVariant(tabName: string) {
        return tabName == activeTab ? 'default' : 'outline';
    }

    function getTabClass(tabName: string) {
        let tabClass = '';
        
        if (tabName != activeTab) {
            tabClass = 'text-gray-500';
            if (unseenMap[tabName] == true) {
                tabClass = tabClass + ' border-2 border-green-500 ';
            }
        }

        return tabClass;
    }

    function selectMessageTab(tabName: string) {
        activeTab = tabName;
        isSendBlocked = getSendBlocked();
    }

    function sendChatMessage() {
        if (activeTab == 'worldChat') {
            clientMessageHandler.sendWorldMessage(username, msgText);
        } else if (activeTab == 'userChat') {
            clientMessageHandler.sendUserMessage(username, msgText);
        } else if (activeTab == 'gameChat') {
            clientMessageHandler.sendGameMessage('6', username, msgText);
        }
        
        msgText = '';
    }
</script>

{#snippet messageTab(tabName: string, icon: string)}
    <Button
        onclick={() => {
            selectMessageTab(tabName);
        }}
        variant={getTabVariant(tabName)}
        class={getTabClass(tabName)}
    >
        <Icon {icon} class="h-[1.2rem] w-[1.2rem] scale-100" />
    </Button>
{/snippet}

{#snippet messageItem(message: ActionableMessage)}
    <li>@{message.sender}
        {#if (username != GUEST && message.actions && message.actions.length > 0)}
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
    <Card.Content class="h-5/6 flex grow flex-col">
        <div class="grid grid-cols-3 gap-1">
            {@render messageTab('worldChat', 'lucide:globe')}
            {@render messageTab('userChat', 'lucide:user-round')}
            {@render messageTab('gameChat', 'icon-park-outline:three')}
        </div>
        <div class="flex-1">
            <ul>
                {#each messageList as msg}
                    {@render messageItem(msg)}
                {/each}
            </ul>
        </div>
        <div>
            <span class="flex gap-1">
                <Input disabled={isSendBlocked} bind:value={msgText} onchange={sendChatMessage} autocomplete="off" />
                <Button disabled={isSendBlocked}
                    onclick={sendChatMessage}>Send</Button
                >
            </span>
        </div>
    </Card.Content>
</Card.Root>
