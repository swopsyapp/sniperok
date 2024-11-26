<script lang="ts">
    import { page } from '$app/stores';
    import Icon from '@iconify/svelte';
    import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
    import SuperDebug from 'sveltekit-superforms';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { logger, LOG_LEVEL_TRACE } from '$lib/logger';
    import * as Form from '$lib/components/ui/form';
    import { Input } from '$lib/components/ui/input';
    import Password from '$lib/components/ui/Password.svelte';
    import { profileSchema, type ProfileSchema } from './ProfileSchema';

    const isTraceOn = logger.settings.minLevel == LOG_LEVEL_TRACE;

    const isProfilePage = ($page.route.id == '/auth/profile');

    export let data: SuperValidated<Infer<ProfileSchema>>;

    const form = superForm(data, {
        dataType: 'json',
        validators: zodClient(profileSchema)
    });

    const { form: formData, enhance } = form;

    const roClass = (isProfilePage ? 'text-muted-foreground aria-readonly' : '');
    const usernameSpanClass = (isProfilePage ? 'col-span-full' : '');
    const btnIcon = ( isProfilePage ? 'mdi:account-edit-outline' : 'mdi:email-plus-outline')
    const btnText = ( isProfilePage ? 'Update' : 'Register')

</script>

{#if (isTraceOn)}
    <SuperDebug data={form} />
    <br/>
{/if}

<form method="POST" use:enhance>
    <div class="grid grid-cols-2 gap-4">
        <div class="col-span-full">
            <Form.Field {form} name="profileMode">
                <Form.Control>
                    {#snippet children({ props })}
                        <Input type="hidden" bind:value={$formData.profileMode} />
                    {/snippet}
                </Form.Control>
            </Form.Field>
            <Form.Field {form} name="email">
                <Form.Control>
                    {#snippet children({ props })}
                        <Input {...props} placeholder="Email*" bind:value={$formData.email} readonly={isProfilePage} class={roClass}/>
                        <Form.FieldErrors />
                    {/snippet}
                </Form.Control>
            </Form.Field>
        </div>
        {#if (!isProfilePage)}
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
        {/if}
        <div class={usernameSpanClass}>
            <Form.Field {form} name="username">
                <Form.Control>
                    {#snippet children({ props })}
                        <Input {...props} placeholder="Username*" bind:value={$formData.username} />
                        <Form.FieldErrors />
                    {/snippet}
                </Form.Control>
            </Form.Field>
        </div>
        <div class="col-span-full"><hr /></div>
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
                <Icon icon={btnIcon}
                    height="none"
                    style="width: 22px; height: 22px" />
                <span class="pl-1">{btnText}</span>
            </Form.Button>
        </div>
    </div>
</form>
