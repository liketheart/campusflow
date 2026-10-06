# CampusFlow

**One campus website where students request college services *and* plan their studies.** Same login, same dashboard, same calendar.

- **Students** submit requests for certificates, lab equipment, maintenance and leave. Each one gets a unique ID like `CF-2026-0001` (with a copy button) and moves through **Pending → Assigned → In Progress → Completed**. Students also add subjects, topics, exam dates, assignment deadlines and weekly study hours, then generate a study schedule. Ticking off topics updates the rest of the plan.
- **Admins** work a queue of every request: assign it to a department (Admin Office, Lab Tech, Maintenance, HOD), change its status, search, filter and sort. They also see stats: pending, in progress, completed and average resolution time.
- **Calendar** shows study blocks, exams, deadlines and service requests together.

Demo accounts (hardcoded):

| Role    | Email                | Password      |
|---------|----------------------|---------------|
| Student | `student@campus.edu` | `password123` |
| Admin   | `admin@campus.edu`   | `password123` |

Seed data loads automatically so the app is never empty: 3 subjects with topics, 3 assignment deadlines, 3 sample requests (Completed / Assigned / Pending) and 1 missed study block from yesterday.

---

## 1) Architecture

- `public/` is the whole website: `index.html` + `styles.css` + vanilla JS. There is no framework and no build step.
- `public/js/store.js` is the data layer: demo login, request IDs and status flow, stats, and the rule-based study scheduler. All data is saved to the browser's **localStorage**. The logged-in user is kept per tab in **sessionStorage**, so a student tab and an admin tab can run side by side.
- `public/js/app.js` is the UI: hash routes (`#/dashboard`, `#/requests`, `#/study`, `#/calendar`, `#/admin`), screens, modals and toasts.
- `netlify/functions/schedule.mjs` is **optional**. It lets Claude write the study schedule (`POST /api/schedule`). When it isn't deployed or has no key, the app silently uses the free rule-based planner.
- It's hosted on **Netlify (free)** as a static site. `netlify.toml` publishes `public/`.
- `streamlit_app.py` is the second, standalone Python version for **Streamlit Community Cloud (free)**. It saves to a JSON file.

## 2) Files

```
.
├── public/
│   ├── index.html          # App shell, fonts, script tags
│   ├── styles.css          # Dark campus design system (mobile-friendly)
│   └── js/
│       ├── store.js        # Data, seed, auth, requests, scheduler (localStorage)
│       └── app.js          # All screens + event handling
├── netlify/functions/
│   └── schedule.mjs        # OPTIONAL Claude schedule endpoint (/api/schedule)
├── netlify.toml            # publish = "public", no build command
├── streamlit_app.py        # Option C: Streamlit edition
├── requirements.txt        # streamlit, pandas
├── .streamlit/config.toml  # Streamlit dark theme matching the web app
└── README.md
```

## 3) Run locally

**Web app (no install needed):**

- The quickest way is to double-click `public/index.html`. Everything works except the optional Claude button, which falls back to the rule-based planner.
- To serve it like production, run one of these from the project folder:
  ```bash
  npx serve public          # → http://localhost:3000
  # or
  python3 -m http.server 8000 --directory public   # → http://localhost:8000
  ```
- To also run the optional Claude function locally:
  ```bash
  npm i -g netlify-cli
  netlify dev                # → http://localhost:8888
  ```

**Streamlit app:**

```bash
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
streamlit run streamlit_app.py                        # → http://localhost:8501
```

## 4) Publish for FREE

### A) Netlify Drop (easiest, no Git)

1. Find the **`public`** folder (it contains `index.html`, `styles.css`, `js/`). That folder is the whole website. You can drag the folder itself, or zip it (right-click → *Compress* / *Send to → Compressed folder*) and drag the zip.
2. Go to **https://app.netlify.com/drop** and log in or sign up for free (GitHub, Google or email).
3. **Drag the `public` folder** (or `public.zip`) onto the drop zone.
4. Wait about 10 seconds. Netlify shows your live URL, e.g. `https://lucky-otter-1a2b3c.netlify.app`.
5. Optional: **Site configuration → Change site name** to get `https://campusflow-yourteam.netlify.app`.

✅ It's **free**: Netlify's Free plan hosts static sites like this one at no cost, with HTTPS included. Netlify Drop doesn't deploy functions, so the "Plan with Claude" button falls back to the rule-based planner. The app still works fully.

### B) Netlify + GitHub (auto-deploys on every push)

1. On GitHub: **New repository** → name it `campusflow` → **Create**. Upload all project files (*Add file → Upload files*) or `git push` them.
2. Go to **https://app.netlify.com** → **Add new project → Import an existing project → GitHub** → pick `campusflow`.
3. Build settings (pre-filled from `netlify.toml`):
   - **Build command:** *(leave empty)*
   - **Publish directory:** `public`
   - **Functions directory:** `netlify/functions`
4. Click **Deploy**. You get `https://<random-name>.netlify.app`, and every `git push` redeploys.
5. The **Free plan is enough**. The optional Claude endpoint runs as a Netlify Function. On Netlify's credit-based plans (Free included), AI Gateway supplies the Anthropic credentials automatically, and usage draws from your included monthly credits. You can also add your own `ANTHROPIC_API_KEY` under *Project configuration → Environment variables*. If neither is available, the rule-based planner is used.

### C) Streamlit Community Cloud (Python, free)

1. Put `streamlit_app.py`, `requirements.txt` and the `.streamlit/` folder in a **public GitHub repo** (this same repo is fine).
2. Go to **https://share.streamlit.io** → sign in with GitHub.
3. Click **Create app → Deploy a public app from GitHub**. Pick the repo, branch `main`, main file `streamlit_app.py` → **Deploy**.
4. In 1–2 minutes you get a public URL like `https://campusflow-yourname.streamlit.app`.

Note: Streamlit Cloud apps sleep after inactivity, and the JSON data file resets when the app restarts. Seed data comes back automatically, which is fine for a demo.

### D) Optional extras

**Supabase (shared real database, free tier):**
1. Create a free project at https://supabase.com → *SQL Editor* → `create table requests (id text primary key, data jsonb, created_at timestamptz default now());`
2. *Authentication → Policies*: enable RLS and add a policy that allows `select/insert/update` for the `anon` role (demo only).
3. *Project Settings → API*: copy the **Project URL** and **anon public key** (the anon key is meant for the browser; never put the `service_role` key in frontend code).
4. Add `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` and change `load/persist/createRequest/updateRequest` in `public/js/store.js` to read and write that table. Nothing else needs to change, because the UI only talks to `window.CF`.

**Render.com (only if you build a Flask version):**
1. Push the Flask app with `requirements.txt` (including `gunicorn`) to GitHub.
2. https://render.com → **New → Web Service** → connect the repo → *Free* instance.
3. Build: `pip install -r requirements.txt` · Start: `gunicorn app:app`.
4. Your URL is `https://<name>.onrender.com`. Free instances sleep when idle, so the first load takes about 30 s.

**Vercel:** fine for this **static** `public/` folder (*New Project → Import → Output directory `public`*) or for a Next.js app. **Don't** host a Flask/Python server on Vercel or Netlify as a normal long-running server; that will fail. Use Render or Streamlit Cloud for Python.

## 5) Two-minute demo script for judges

| Time | Do this | Say this |
|------|---------|----------|
| 0:00 | Open the site → click **🎓 Student demo** | "One login for both services and studies, not two apps." |
| 0:15 | Dashboard: point at **study progress ring, next exam, open requests, notifications** and the red **missed block** banner → click **Reschedule** | "I missed a block yesterday. One click and the remaining plan is rebuilt." |
| 0:35 | **Requests** → pick **🔬 Lab Equipment**, type "Oscilloscope for ECE lab", priority High → **Submit** | "Every request gets a unique ID…" → click **Copy ID** |
| 0:55 | **Study Planner** → tick **Trees & BST** done → show "Next 14 days" updating; drag weekly hours → **Generate schedule** | "Closer exams and more remaining topics get more slots. Rule-based and free, with optional Claude." |
| 1:15 | **Calendar** → show study blocks, exam, deadlines **and** requests on the same grid → click today | "Everything a student has to do, on one calendar." |
| 1:30 | Open a **second tab** → sign in as **🛡️ Admin demo** | "Same app, admin view. It updates live across tabs." |
| 1:40 | Search the new ID → assign **Lab Tech** → click **→ In Progress** → **→ Completed**; point at **stats** | "Pending, completed and average resolution time update instantly." |
| 1:55 | Switch back to the student tab → bell shows the notification | "The student was notified. That's CampusFlow." |

Tip: use **Reset demo data** in the sidebar before you present.

## Public URL you'll get

- Netlify: `https://<random-name>.netlify.app` (rename it to e.g. `https://campusflow-yourteam.netlify.app`). This project: `https://rainbow-squirrel-c8c439.netlify.app`
- Streamlit: `https://<app-name>.streamlit.app`

## Checklist

Local run ✅  Netlify ✅  Streamlit ✅

## Roadmap ideas

- Shared data across devices: move `store.js` persistence to Netlify Database (or Supabase) behind a small API.
- Real accounts with Netlify Identity instead of hardcoded demo users.
- File attachments on requests (e.g. medical certificate for leave).
