<script lang="ts">
    import Icon from '@iconify/svelte';
    import { Input } from '$lib/components/ui/input';

    let { value = $bindable(), placeholder, ...restProps } = $props();

    let show = $state(false);

    import { Button } from '$lib/components/ui/button/index.js';

    function toggleShow() {
        if (show) {
            show = false;
        } else {
            show = true;
        }
    }
</script>

<span class="flex">
    <span class="pr-1">
        <Input {...restProps} type={show ? 'text' : 'password'} {placeholder} bind:value/>
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
