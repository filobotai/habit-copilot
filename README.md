# Habit Copilot

A tiny habit tracker that lives in your browser.

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Persists to `localStorage`

## Features

- Add / edit / delete habits
- Daily check-ins (mark done for today)
- Streaks (consecutive days) + best streak
- Simple stats (habits, done today, completion %, best streak)
- Export JSON (backup)
- Import JSON (restore / move devices)

## Local development

Requirements: Node.js 18+ (Node 20+ recommended).

```bash
cd habit-copilot
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Deploy to Vercel

1. Push this folder to a GitHub/GitLab/Bitbucket repo.
2. Go to <https://vercel.com/new> and import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Build command: `npm run build` (default)
5. Output: handled by Next.js (default)

That’s it — every page is static/client-side and data stays in the user’s browser.

## Data format

The app stores an array of habits in `localStorage` under the key:

- `habit-copilot:v1`

Exported JSON looks like:

```json
{
  "app": "habit-copilot",
  "version": 1,
  "exportedAt": 0,
  "habits": []
}
```

