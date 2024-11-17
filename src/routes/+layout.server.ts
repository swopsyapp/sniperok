import { loadFlash } from 'sveltekit-flash-message/server';

export const load = loadFlash(async ({ locals: { session } }) => {
  return {
    session,
  };
});
