<script>
    import { enhance } from '$app/forms';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import * as Card from '$lib/components/ui/card/index';
    import Icon from '@iconify/svelte';

    /** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
    let { data, form } = $props();
</script>

<Card.Root class="mx-auto max-w-md">
    <Card.Header>
        <Card.Title class="text-3xl font-thin">Register</Card.Title>
        <Card.Description>Register with your email address</Card.Description>
    </Card.Header>
    <Card.Content class="">

        <!-- 
            https://dev.to/deyemiobaa/adding-custom-validation-to-a-form-with-tailwindcss-1e7d
            https://www.stoman.me/articles/tailwind-css-form-validations
         -->
        {#if form?.emailRequired}
            <p>email is required</p>
        {/if}

        <form method="POST" class="auth-form" use:enhance>
            <div class="grid grid-cols-2 gap-4">
                <div  class="col-span-2">
                    <Label>
                        <span>Email</span>
                        <Input
                            type="text"
                            name="email"
                            required
                            value={form?.email ?? ''}
                        />
                        <span class="mt-2 hidden text-sm text-red-500 peer-[&:not(:placeholder-shown):not(:focus):invalid]:block">
                            Please enter a valid email address
                        </span>
                    </Label>
                </div>
                <div>
                    <Label>Password</Label>
                    <Input type="password" name="password" required />
                </div>
                <div>
                    <Label>Username</Label>
                    <Input type="text" name="username" required />
                </div>
                <div  class="col-span-2"><hr></div>
                <div>
                    <Label><i>Forename</i></Label>
                    <Input type="text" name="forename" />
                </div>
                <div>
                    <Label><i>Surname</i></Label>
                    <Input type="text" name="surname" />
                </div>
                <div>
                    <Label><i>Birthday</i></Label>
                    <Input type="date" name="birthday" />
                </div>
                <div class="flex flex-col items-center justify-center pt-5">
                    <Button type="submit" class="w-full items-center justify-start">
                        <Icon icon="mdi:email-plus-outline" class="h-6 w-6" />
                        <span class="pl-1">Register</span>
                    </Button>
                </div>
            </div>
        </form>
    </Card.Content>
</Card.Root>
