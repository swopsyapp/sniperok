<script lang="ts">
    import { io } from 'socket.io-client';

    import * as Card from '$lib/components/ui/card/index';

    interface Message {
        type: string;
        sender: string;
        text: string;
    }

    let messages: Message[] = $state([]);
    const socket = io();

    socket.on('eventFromServer', (message) => {
        console.log(message);
        let msg = {} as Message;
        msg.type = 'event';
        msg.sender = 'system';
        msg.text = message;
        messages.push(msg);
    });
</script>

<Card.Root class="mx-auto h-full max-w-md">
    <Card.Header>
        <Card.Title class="text-center text-4xl font-thin">Messages</Card.Title>
    </Card.Header>
    <Card.Content>
        <ul>
            {#each messages as msg}
                <li>{msg.text}</li>
            {/each}
        </ul>
    </Card.Content>
</Card.Root>
