<script lang="ts">
    import { goto } from '$app/navigation';

    import { clientMessageHandler } from '$lib/components/messages.svelte';

    clientMessageHandler.logout();

    goto('/', { invalidateAll: true });
</script>
