<script>
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import * as Card from '$lib/components/ui/card/index';
    import Icon from '@iconify/svelte';
</script>

<Card.Root class="mx-auto max-w-md">
    <Card.Header>
        <Card.Title class="text-3xl font-thin">Register</Card.Title>
        <Card.Description>Register with your email address</Card.Description>
    </Card.Header>
    <Card.Content>

        <form action="?/register" method="POST" class="auth-form">
            <Label for=""> Email </Label>
            <Input type="text" name="email" />
            <br>
            <Label for=""> Password </Label>
            <Input type="password" name="password" />
            <Button href="/auth/login/github" class="flex items-center gap-2">
                <Icon icon="mdi:email-plus-outline" class="h-6 w-6" />
                Register
            </Button>
        </form>

    </Card.Content>
    
</Card.Root>
