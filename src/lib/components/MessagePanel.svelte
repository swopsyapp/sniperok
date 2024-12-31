<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { io } from 'socket.io-client';

    import * as Card from '$lib/components/ui/card/index';
    import Input from './ui/input/input.svelte';
    import { Button } from './ui/button';
    import { logger } from "$lib/logger";

    interface Message {
        type: string;
        sender: string;
        text: string;
    }

    let msgText: string = $state('');
    let worldChatMessages: Message[] = $state([]);
    const socket = io();

    function appendWorldChatMessage(message : string) {
        logger.debug(message);
        let msg = {} as Message;
        msg.type = 'event';
        msg.sender = 'system';
        msg.text = message;
        worldChatMessages.push(msg);
    }

    socket.on('eventFromServer', (message) => {
        appendWorldChatMessage(message);
    }).on('worldChat', (message) => {
        appendWorldChatMessage(message);
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

    function sendWorldChatMessage() {
        logger.debug('msgText=', msgText);
        if (msgText) {
            socket.emit('worldChat', msgText);
            msgText = '';
            logger.debug('sent');
        } else {
            logger.debug('Not sent');
        }
    }
</script>

<Card.Root class="mx-auto h-full max-w-md">
    <Card.Header>
        <Card.Title class="text-center text-4xl font-thin">Messages</Card.Title>
    </Card.Header>
    <Card.Content class="flex flex-col h-5/6">
            <div class="flex-grow">
                <ul>
                    {#each worldChatMessages as msg}
                        <li>{msg.text}</li>
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
