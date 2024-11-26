<script lang="ts">
    import * as Card from '$lib/components/ui/card/index';
    import type { PageData } from './$types.js';
    import ProfileForm from '$lib/components/ui/profile/profile-form.svelte';
    export let data: PageData;
</script>

<Card.Root class="mx-auto max-w-md">
    <Card.Header>
        <Card.Title class="text-3xl font-thin">Profile</Card.Title>
        <Card.Description>Update your profile information</Card.Description>
    </Card.Header>
    <Card.Content>
        <ProfileForm data={data.form} />
    </Card.Content>
</Card.Root>
