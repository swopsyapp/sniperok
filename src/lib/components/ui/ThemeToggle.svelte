<script lang="ts">
    import Icon from '@iconify/svelte';

    import { toggleMode } from 'mode-watcher';
    import { Button } from '$lib/components/ui/button/index.js';
</script>

<Button onclick={toggleMode} class="w-1/2 justify-start">
    <Icon
        icon="lucide:sun"
        class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
    />
    <Icon
        icon="lucide:moon"
        class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
    />
    <span class="pl-1">Theme</span>
</Button>
