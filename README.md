# Physics 421 — E&M Study Platform

Interactive E&M learning platform with 17 animated visualizations, a custom practice builder, and an AI tutor. Designed for visual learners with ADHD.

---

## Run Locally

```bash
npm install
cp .env.example .env
# Edit .env — see "Configuration" below
npm run dev
```

Open http://localhost:5173

---

## Configuration

Both keys are optional — the app degrades gracefully without them.

### AI Tutor (optional)

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at https://console.anthropic.com/  
Set this in Netlify environment variables (not in `.env` — it is a server-side secret used only by Netlify Functions).  
Without this: all 17 visualizations and practice questions work. The tutor shows a setup banner instead of connecting.

### Auth + Saved Progress (optional)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Create a free project at https://supabase.com  
Copy values from: Project Settings → API

Without this: the app runs without authentication. `ProtectedRoute` bypasses the login check automatically.

**After adding Supabase:** run the SQL in `src/lib/supabase-schema.sql` in your Supabase SQL editor to create the required tables and policies.

---

## Features

### 17 Interactive Visualizations
Each has play/pause/replay/slow-mode controls and a "What to notice" caption.

| # | Topic |
|---|-------|
| 1 | Electric Charge & Coulomb's Law |
| 2 | Electric Field |
| 3 | Electric Flux |
| 4 | Gauss's Law |
| 5 | Electric Potential |
| 6 | Potential Energy |
| 7 | Capacitors & Dielectrics |
| 8 | Current & Resistance |
| 9 | DC Circuits |
| 10 | Magnetic Fields |
| 11 | Magnetic Force |
| 12 | Sources of B Fields (Biot-Savart) |
| 13 | Ampere's Law |
| 14 | Faraday's Law |
| 15 | Inductance |
| 16 | RLC Circuits |
| 17 | Electromagnetic Waves |

### Practice Builder
- Select any subset of the 17 topics
- Choose total questions, MCQ count, FRQ count
- Filter by difficulty (Intro / Mid / Advanced)
- FRQ includes rubric + sample answer reveal

### AI Tutor
- Floating panel (bottom-right) on all pages
- Full-page chat at `/tutor`
- Knows your current topic context
- Suggests visualizations inline
- Graceful "not configured" state when API key is missing

### Auth (when Supabase is configured)
- Email/password signup and login
- Persistent sessions
- Profile with display name
- Progress tracking across sessions

---

## Stack

- **React 19 + Vite + TypeScript**
- **Tailwind CSS v4 + Framer Motion** — dark theme, ADHD-friendly UX
- **HTML5 Canvas** — all 17 physics simulations
- **Zustand** — global state
- **React Router v7** — routing with protected routes
- **Supabase** — auth, database, RLS
- **Anthropic SDK** — AI tutor (claude-sonnet-4-20250514)
