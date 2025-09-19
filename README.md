# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2a3035bf-d281-4472-8eca-5146b6c29289

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2a3035bf-d281-4472-8eca-5146b6c29289) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## OpenRouter Setup

- Create an account at https://openrouter.ai and generate an API key.
- Copy `.env.example` to `.env` and set `VITE_OPENROUTER_API_KEY=<your_key>`.
- Restart the dev server after changing envs. In the browser build, requests include `HTTP-Referer` and `X-Title` per OpenRouter guidance.
- Never commit your real key. `.env` is ignored by Git.

The app uses a minimal browser client in `src/lib/openrouter.ts`. It fails fast if no key is set.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2a3035bf-d281-4472-8eca-5146b6c29289) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## How to Play Online (with Annette)

- Same seed + same settings = same run. Share a seed and configuration so both see (nearly) identical questions.
- Suggested flow: one person hosts a call, announces the seed; both click “New Question,” answer locally, then compare reactions and scores.
- You can also pre-generate “packs” of questions for offline nights, export to JSON, and import later to play without network calls.
- Safety toggles let you keep humor PG-13: default snark on, no politics, light innuendo optional, and always kind (no punching down).
