<script lang="ts">
    import * as Form from '$lib/components/ui/form';
    import { Input } from '$lib/components/ui/input';
    import { registerSchema, type RegisterSchema } from './RegisterSchema';
    import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import Icon from '@iconify/svelte';
    import Password from '$lib/components/ui/Password.svelte';

    export let data: SuperValidated<Infer<RegisterSchema>>;

    const form = superForm(data, {
        validators: zodClient(registerSchema)
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
        <div>
            <Form.Field {form} name="username">
                <Form.Control>
                    {#snippet children({ props })}
                        <Input {...props} placeholder="Username*" bind:value={$formData.username} />
                        <Form.FieldErrors />
                    {/snippet}
                </Form.Control>
            </Form.Field>
        </div>
        <div class="col-span-2"><hr /></div>
        <div>
            <Form.Field {form} name="name">
                <Form.Control>
                    {#snippet children({ props })}
                        <Input {...props} placeholder="Name" bind:value={$formData.name} />
                        <Form.FieldErrors />
                    {/snippet}
                </Form.Control>
            </Form.Field>
        </div>
        <div>
            <Form.Field {form} name="surname">
                <Form.Control>
                    {#snippet children({ props })}
                        <Input {...props} placeholder="Surname" bind:value={$formData.surname} />
                        <Form.FieldErrors />
                    {/snippet}
                </Form.Control>
            </Form.Field>
        </div>
        <div>
            <Form.Field {form} name="birthday">
                <Form.Control>
                    {#snippet children({ props })}
                        <Input
                            {...props}
                            type="date"
                            placeholder="Birthday"
                            bind:value={$formData.birthday}
                        />
                        <Form.FieldErrors />
                    {/snippet}
                </Form.Control>
            </Form.Field>
        </div>
        <div class="flex flex-col items-center justify-center pb-2">
            <Form.Button class="w-full items-center justify-start">
                <Icon icon="mdi:email-plus-outline" class="h-6 w-6" />
                <span class="pl-1">Register</span>
            </Form.Button>
        </div>
    </div>
</form>
