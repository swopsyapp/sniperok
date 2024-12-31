<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { io } from 'socket.io-client';
    import Icon from '@iconify/svelte';

    import { page } from '$app/stores';
    import * as Card from '$lib/components/ui/card/index';
    import Input from './ui/input/input.svelte';
    import { Button } from './ui/button';
    import { logger } from "$lib/logger";

    interface Message {
        type: string;
        sender: string;
        text: string;
    }

    let user = $page.data.user;
    let username = user?.user_metadata.username ?? 'Guest';

    let activeTab: string = $state('worldChat');
    let msgText: string = $state('');
    let worldChatMessages: Message[] = $state([]);
    let userChatMessages: Message[] = $state([]);
    let gameChatMessages: Message[] = $state([]);
    let messages = $derived(activeTab == 'gameChat' ? gameChatMessages : activeTab == 'userChat' ? userChatMessages : worldChatMessages);
    const socket = io();

    function appendWorldChatMessage(messageType : string, messageSender: string, messageText : string) {
        logger.debug(messageText);
        let msg = {} as Message;
        msg.type = messageType;
        msg.sender = messageSender;
        msg.text = messageText;
        worldChatMessages.push(msg);
    }

    socket.on('eventFromServer', (message) => {
        appendWorldChatMessage('event', 'system', message);
    }).on('worldChat', (message) => {
        appendWorldChatMessage(message.type, message.sender, message.text);
    });

    onMount(() => {
        const msgForm = document.getElementById('msg_form');

        msgForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (msgText) {
                socket.emit('chat message', msgText);
                msgText = '';
            }
        });
    });

    onDestroy(() => {
        logger.debug('MessagePanel destroy');
    });

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
        logger.debug('msgText=', msgText);
        if (msgText) {
            let msg = {} as Message;
            msg.type = 'worldChat';
            msg.sender = username;
            msg.text = msgText;

            socket.emit('worldChat', msg);
            msgText = '';
            logger.debug('sent');
        } else {
            logger.debug('Not sent');
        }
    }
</script>

{#snippet messageTab(tabName: string, icon: string)}
    <Button onclick={() => {selectMessageTab(tabName)}} variant={getTabVariant(tabName)} class={getTabtextColor(tabName)} >
        <Icon icon={icon} class="h-[1.2rem] w-[1.2rem] scale-100" />
    </Button>
{/snippet}

<Card.Root class="mx-auto h-full max-w-md">
    <Card.Header>
        <Card.Title class="text-center text-4xl font-thin">Messages</Card.Title>
    </Card.Header>
    <Card.Content class="flex flex-col h-5/6">
            <div class="grid grid-cols-3 gap-1">
                {@render messageTab('worldChat', 'lucide:globe')}
                {@render messageTab('userChat', 'lucide:user-round')}
                {@render messageTab('gameChat', 'icon-park-outline:three')}
            </div>
            <div class="flex-grow">
                <ul>
                    {#each messages as msg}
                        <li>@{msg.sender} : {msg.text}</li>
                    {/each}
                </ul>
            </div>
            <div class="pb-1">
                <span class="flex gap-1">
                    <Input bind:value={msgText} autocomplete="off" /><Button onclick={sendWorldChatMessage}>Send</Button>
                </span>
            </div>
    </Card.Content>
</Card.Root>
