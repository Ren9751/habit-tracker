# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal PWA habit tracker ("習慣トラッカー") built with pure vanilla HTML/CSS/JavaScript. No build tools, no dependencies, no transpilation. Deployed to GitHub Pages at `https://ren9751.github.io/habit-tracker/`.

## Development

No build step required. Open `index.html` directly in a browser, or serve locally:

```bash
python3 -m http.server 8000
# or
npx serve .
```

No linting or test suite is configured.

## Architecture

**Single-file JS app** — all logic lives in `app.js` (~1040 lines) with three classes:

- **`Store`** — localStorage wrapper. Keys: `tasks` (task array), `log-YYYY-MM-DD` (daily log per date), `lastResetDate`.
- **`DateUtils`** — static date helpers. `getTodayDate()` uses a 3:00 AM cutoff (before 3 AM = previous day).
- **`HabitTracker`** — main app class, instantiated as `window.app`. Owns all state and rendering.

**Data model:**
- `tasks[]` — current task list `{ id, name, order, done, memo }`
- `log-YYYY-MM-DD` — daily snapshot `{ date, entries: [{ taskId, taskName, done, memo }] }`

**Key logic:**
- **Daily reset** (`checkAndResetIfNeeded`): On every load, if today > `lastResetDate`, saves yesterday's log snapshot then resets all tasks to `done: false`.
- **Reward system** (`calculateStreak`, `renderStreak`, `checkAndCelebrate`): Streak counts consecutive days where ALL tasks were completed. Confetti + toast fire once per day when all tasks are done.
- **Log tab**: Inline calendar shows completion history. Clicking a past date opens an edit panel to retroactively update that day's log.

**UI structure** (`index.html`):
- Two tabs: "今日" (today) and "ログ" (log history)
- Settings modal for task management (add/delete/reorder) and JSON export/import

## Service Worker

`sw.js` caches all static assets under cache key `habit-tracker-v2`. After editing any cached file, bump the version string in `sw.js` to force users to get the updated cache.
