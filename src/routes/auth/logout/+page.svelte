<script lang="ts">
    import { goto } from '$app/navigation';

    import { clientMessageHandler } from '$lib/components/messages.svelte';
    
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    clientMessageHandler.logout();

    goto('/', { invalidateAll: true } );

</script>