<script lang="ts">
    import * as Card from '$lib/components/ui/card/index';
    import type { PageData } from './$types.js';
    import LoginForm from './login-form.svelte';

    let { data }: { data: PageData } = $props();
</script>

<Card.Root class="mx-auto max-w-md">
    <Card.Header>
        <Card.Title class="text-3xl font-thin">Login</Card.Title>
        <Card.Description>Login with your email address</Card.Description>
    </Card.Header>
    <Card.Content>
        <LoginForm data={data.form} />
    </Card.Content>
</Card.Root>
