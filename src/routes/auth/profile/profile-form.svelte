<script lang="ts">
    import * as Form from '$lib/components/ui/form';
    import { Input } from '$lib/components/ui/input';
    import { profileSchema, type ProfileSchema } from './ProfileSchema';
    import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import Icon from '@iconify/svelte';
    import Password from '$lib/components/ui/Password.svelte';

    export let data: SuperValidated<Infer<ProfileSchema>>;

    const form = superForm(data, {
        validators: zodClient(profileSchema)
    });

    const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance>
    <div class="grid grid-cols-2 gap-4">
        <div class="col-span-full">
            <Form.Field {form} name="email">
                <Form.Control>
                    {#snippet children({ props })}
                        <Input
                            {...props}
                            placeholder="Email*"
                            bind:value={$formData.email}
                            readonly={true}
                            class="aria-readonly text-muted-foreground"
                        />
                        <Form.FieldErrors />
                    {/snippet}
                </Form.Control>
            </Form.Field>
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
                <Icon
                    icon="mdi:account-edit-outline"
                    height="none"
                    style="width: 22px; height: 22px"
                />
                <span class="pl-1">Update</span>
            </Form.Button>
        </div>
    </div>
</form>
