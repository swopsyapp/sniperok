<script lang="ts">
    // see https://github.com/sveltejs/kit/issues/4941#issuecomment-1470959347
    import { page } from '$app/stores';
    import Page from './+layout.svelte';

    // export let data;
    const { data } = $props();
</script>

<!-- This is an workaround for: https://github.com/sveltejs/kit/issues/4941 -->
{#key $page.url.pathname}
    <Page {data} children/>
{/key}
