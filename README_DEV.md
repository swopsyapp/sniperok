# sniperok

## See
- https://github.com/razshare/sveltekit-sse
- https://github.com/andywer/pg-listen

## Build

```
git clone https://github.com/swopsyapp/sniperok.git
pnpm install
supabase start
pnpm dev
```

## DB Migrations

See https://supabase.com/docs/guides/local-development/overview#diffing-changes  

`supabase db diff --schema public`

`supabase migration new create_league`

copy output from diff into newly created empty migration file.

`supabase db reset`
