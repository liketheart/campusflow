# AGENTS.md — CampusFlow

## What this is
A hackathon campus app with two halves in **one** product: service requests (certificates, lab equipment, maintenance, leave) and study planning (subjects, topics, exams, deadlines, generated schedule). They share one login, one dashboard and one calendar. There are two deliverables:
1. **Static web app** in `public/` (vanilla HTML/CSS/JS, no build step), hosted on Netlify.
2. **Streamlit edition** in `streamlit_app.py`, hosted on Streamlit Community Cloud. It is a separate, self-contained Python port with the same features and seed data.

## Layout
- `public/index.html` is the shell. It loads `js/store.js`, then `js/app.js` as classic scripts (not ES modules), so the site also works from `file://` and Netlify Drop.
- `public/js/store.js` is the **only** data layer. It exposes `window.CF` (constants, auth, requests, study, scheduler). It persists to `localStorage['campusflow:v1']`; the session user is in `sessionStorage['campusflow:session']`. A `storage` event listener syncs tabs live. To add a real backend, change this file only.
- `public/js/app.js` holds the UI: the hash router, view functions returning template strings, and event delegation through `data-action` / `data-change` / `data-input` / `data-form` attributes. Every `CF` mutation calls `save()`, which emits and triggers a full re-render. The admin queue table is re-rendered on its own (`renderQueue`) so the search box keeps focus.
- `public/styles.css` holds the design tokens in `:root`. Use those CSS variables; don't add new ad-hoc colours. Status colours: Pending = amber, Assigned = violet, In Progress = sky, Completed = mint. Lime is the CTA/highlight colour. Rose is for exams and urgent items.
- `netlify/functions/schedule.mjs` is the optional Claude scheduler (`/api/schedule`, model `claude-sonnet-5-5`, plain `fetch`, no npm deps). It returns 503 without `ANTHROPIC_API_KEY`; the frontend then falls back to the rule-based planner. `CF.applyAiBlocks` validates every AI block.

## Non-obvious decisions
- **localStorage on purpose**: the user wanted a Netlify Drop–deployable static app, which can't include functions or a database. Data is per-browser. For the demo, use two tabs in the same browser.
- Request IDs are `CF-<year>-<4-digit counter>`, with the counter per year in `state.counters`.
- Scheduler (`planBlocks`): 1-hour blocks, weekly hours spread over weekdays (extra blocks go Mon, Wed, Fri, Sat first), up to 4 slots per day at fixed evening times. Each slot goes to the subject with the highest remaining-hours ÷ days-to-exam, with a 0.45× penalty if the subject was already scheduled that day. Regenerating keeps past/done/missed blocks and replaces future planned ones. Past planned blocks automatically become `missed`. "Reschedule" turns them into `rescheduled` (hidden from the calendar).
- Changing a status away from Pending without a department auto-assigns the type's default department.
- The seed is generated relative to today, so the demo always looks current. Bump `version` in `store.js` if the state shape changes.

## Conventions
- No framework and no build step. Keep both JS files dependency-free.
- Escape all user text with `esc()` before putting it in HTML.
- Keep the Streamlit port's behaviour in sync when changing business rules (statuses, departments, scheduler).
