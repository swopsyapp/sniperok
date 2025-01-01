<script lang="ts">
    import { goto } from '$app/navigation';

    import { messageHandler } from '$lib/components/messages.svelte';
    
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    messageHandler.logout();

    goto('/');

</script>