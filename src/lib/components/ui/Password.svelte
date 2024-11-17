<script lang="ts">
    import type { HTMLInputAttributes } from "svelte/elements";
    import type { WithElementRef } from "bits-ui";
    import Icon from '@iconify/svelte';
    import { Input } from '$lib/components/ui/input';

    let {
        value = $bindable(),
        placeholder,
        ...restProps
    }: WithElementRef<HTMLInputAttributes> = $props();

    let show = $state(false);

    import { Button } from '$lib/components/ui/button/index.js';
</script>

<span class="flex">
    <span class="pr-1">
        <Input
            type={show ? 'text' : 'password'}
            {placeholder}
            bind:value={value}
            {...restProps}
        />
    </span>
    <Button onclick={() => (show = !show)} variant="outline" size="icon">
        {#if show}
            <Icon
                icon="lucide:eye"
                class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-0 dark:scale-100"
            />
        {:else}
            <Icon
                icon="lucide:eye-off"
                class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-0 dark:scale-100"
            />
        {/if}
    </Button>
</span>
