<script lang="ts">
    import Icon from '@iconify/svelte';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';

    import * as Form from '$lib/components/ui/form';
    import { Input } from '$lib/components/ui/input';
    import Password from '$lib/components/ui/Password.svelte';

    import { loginSchema, type LoginSchema } from './LoginSchema';
    import type { PageData } from './$types.js';

    export let data: SuperValidated<Infer<LoginSchema>>;

    const form = superForm(data, {
        validators: zodClient(loginSchema)
    });

    const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance>
    <div class="grid grid-cols-2 gap-4">
        <div class="col-span-full">
            <Form.Field {form} name="email">
                <Form.Control>
                    {#snippet children({ props })}
                        <Input {...props} placeholder="Email*" bind:value={$formData.email} />
                        <Form.FieldErrors />
                    {/snippet}
                </Form.Control>
            </Form.Field>
        </div>
        <div>
            <Form.Field {form} name="password">
                <Form.Control>
                    {#snippet children({ props })}
                        <Password
                            {...props}
                            placeholder="Password*"
                            bind:value={$formData.password}
                        />
                        <Form.FieldErrors />
                    {/snippet}
                </Form.Control>
            </Form.Field>
        </div>
        <div class="flex flex-col items-center justify-center pb-2">
            <Form.Button class="w-full items-center justify-start">
                <Icon icon="mdi:email-plus-outline" class="h-6 w-6" />
                <span class="pl-1">Login</span>
            </Form.Button>
        </div>
    </div>
</form>
