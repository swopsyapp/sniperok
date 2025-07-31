# sniperok

sniperok is a game of rock-paper-scissors.

## Application Features
### Login
The application provides user registration and login implemented via supabase.
It allows verified user registration/sign-up and login/sign-in via email and also guest login.
Guests are users which have limited funtionality.

### Buddies
Registered users can add buddies.
Registered users can receive buddy reuests and choose to accept or decline.

### Boosts
Registered players can earn boosts and trade them and use them.
Boost types are swappable or playable
- Snaps    are swappable
- Shotgun  is playable
- Dynamite is playable
- Bazooka  is playable

Users can swap 3 Snaps for a Shotgun, Dynamite or Bazooka.

### Games
All users can list public games, whether they are registered users, guest users or unauthenticated visitors.
Registered and guest users can join public games.
Registered users can also see non-public games to which they have been invited, and can choose to join the game.
Registered users can create games which they will automatically join and will become the game curator.
Registered users can invite their buddies to the game.
The game consists of an odd number of rounds.
At the end of each round a round summary is displayed showing the users actions and scores.
After the last round an additional summary is shown displaying the overall player scores in descending order by score.
When a player wins a game i.e. has the single highest overall score and if there are no guest users in the game,
then the player wins a boost of type snap.
Within the round the curator starts the play which triggers a 3 second countdown for the player to play their weapon,
- Rock
- Paper
- Scissors
Normal rules apply i.e. Rock beats Scissors, Scissors beats Paper, Paper beats Rock.
If the user has any playable boosts, they can spend them to play
- Shotgun  beats Dynamite and Rock and Scissors
- Dynamite beats Bazooka and Rock and Paper
- Bazooka  beats Shotgun and Paper and Scissors


## Technologies

- [SvelteKit](https://kit.svelte.dev/): A framework for building web applications with Svelte
- [TypeScript](https://www.typescriptlang.org/): A typed superset of JavaScript that compiles to plain JavaScript
- [Supabase](https://supabase.io/): An open-source Firebase alternative
- [Kysely](https://kysely.dev/): type-safe SQL query builder for TypeScript
- [shadcn-svelte](https://shadcn-svelte.com): A Tailwind CSS component library for Svelte, based on [shadcn](https://shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework
- [Iconify](https://iconify.design): A unified icon framework using icons from [icones.js](https://icones.js.org/collection/all)
- [Zod](https://zod.dev): A TypeScript-first schema declaration and validation library
- [socket.io](https://socket.io/) WebSockets, Bidirectional and low-latency communication for every platform

## Getting Started

### Running Locally

#### Prerequisites

- docker: https://docs.docker.com/desktop/
- supabase cli: https://supabase.com/docs/guides/local-development/cli/getting-started
- node.js: https://nodejs.org/en/download
- pnpm: https://pnpm.io/installation

1. Clone the repo

```bash
git clone https://github.com/swopsyapp/sniperok.git
cd sniperok
```

2. Install dependencies

```bash
pnpm i
```

3. Create a `.env.local` based on `.env.example` and fill in your own credentials

```bash
cp .env.example .env.local
```

4. Start your supabase server with

```bash
supabase start
```

**Note:** You need to have the [Supabase CLI](https://supabase.io/docs/guides/cli) installed to run the above command.

5. Supabase console will be available at `http://localhost:54323`

6. Start your app

```bash
pnpm run dev
```

7. Navigate to [localhost:5173](http://localhost:3000) to see your app running.

### Deploying to Vercel

The easiest way to deploy this app is to use Vercel. You can deploy this app with the following steps:

### Database

1. Create a new project in the Supabase dashboard

2. Login to supabase using the console

```bash
supabase login
```

3. Link your project to the supabase cli

```bash
supabase link --project-ref <YOUR_PROJECT_ID>
```

4. Deploy your database

```bash
supabase db push
```

### Client

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Add a new github OAuth app in the Github developer settings
4. Configure your environment variables, make sure you are using updated values from your newly-created Supabase project and Github OAuth app
5. Deploy

## Contributing

Contributions are welcome! Please feel free to submit a PR or open an issue.

## Thanks

Shout out to [Davis Media](https://github.com/Davis-Media) for building the base template for this project! 🤙
