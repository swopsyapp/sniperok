<script lang="ts">
    import * as Card from '$lib/components/ui/card/index';
    import type { PageData } from './$types.js';
    import RegisterForm from './register-form.svelte';
    export let data: PageData;
</script>

<Card.Root class="mx-auto max-w-md">
    <Card.Header>
        <Card.Title class="text-3xl font-thin">Register</Card.Title>
        <Card.Description>Register with your email address</Card.Description>
    </Card.Header>
    <Card.Content>
        <RegisterForm data={data.form} />
    </Card.Content>
</Card.Root>
