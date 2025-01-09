<script lang="ts">
    import * as Card from '$lib/components/ui/card/index';
    import { logger } from '$lib/logger';

    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    logger.debug(data.game);
</script>

<Card.Root class="mx-auto max-w-md">
    <Card.Header>
        <Card.Title class="w-10/12 text-center text-4xl font-thin">Game</Card.Title>                
    </Card.Header>
    <Card.Content>
        fun goes here
        <br/>get start conditions and counts of joined and connected players.
        <br/>see
        <ul>
            <li>- <a href="https://socket.io/docs/v4/server-api/#serverinroom" target="_blank">#serverinroom</a></li>
            <li>- <a href="https://socket.io/docs/v4/server-api/#servertoroom" target="_blank">#servertoroom</a></li>
            <li>- <a href="https://github.com/socketio/socket.io/blob/7427109658591e7ce677a183a664d1f5327f37ea/packages/socket.io/lib/broadcast-operator.ts#L359C10-L359C23" target="_blank">BroadcastOperator.fetchSockets()</a></li>
            
        </ul>
    </Card.Content>
</Card.Root>
