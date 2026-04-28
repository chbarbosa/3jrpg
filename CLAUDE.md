# 3JRPG — CLAUDE.md

This file provides context for Claude Code on the 3JRPG project.
Read this before every prompt. Do not skip sections.

---

## Project Overview

**3JRPG** is a portfolio web game — an endless turn-based JRPG battle game set in a magitech world (FF6/FF7 tone, Phantasy Star visual inspiration). The player assembles a trio of heroes and fights through infinite escalating enemy encounters. HP and EN carry over between fights. Death = full reset (roguelite).

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Java 17 / Spring Boot |
| Database | H2 in-memory (dev) |
| Auth | JWT via Spring Security |
| API | REST / JSON |
| Audio | Howler.js (SFX only) |

---

## Project Structure

After the first 4 prompts (B1, B2, F1, F2) the project structure is:

```
3jrpg/
├── backend/                        # Spring Boot
│   ├── src/main/java/com/jrpg/
│   │   ├── config/                 # SecurityConfig, CorsConfig, JwtConfig
│   │   ├── auth/                   # AuthController, AuthService, JwtUtil
│   │   ├── model/                  # JPA entities (Player, Run, RunEvent, Season, SeasonResult)
│   │   └── repository/             # JPA repositories
│   └── src/main/resources/
│       └── application.properties  # H2, JWT secret, CORS origin
│
└── frontend/                       # React (Vite)
    ├── src/
    │   ├── styles/
    │   │   └── theme.js            # ALL design tokens — colors, fonts, spacing, animations
    │   ├── components/
    │   │   └── AlertModal.jsx      # Reusable confirmation/alert modal
    │   ├── pages/                  # Screen-level components
    │   ├── hooks/                  # Custom React hooks
    │   ├── services/               # API call functions (axios or fetch)
    │   └── main.jsx                # Entry point + router
    └── index.html
```

---

## Absolute Rules

These rules apply to every single prompt — never violate them:

### Security
- **Never expose database IDs** — all public-facing IDs use UUID. Internal auto-increment IDs never appear in API responses.
- JWT tokens on all protected endpoints — verified via Spring Security filter.
- Input validation with `@Valid` + Bean Validation on all request DTOs.
- JPA/Hibernate only — no raw SQL queries.
- CORS configured via `CorsConfigurationSource` — frontend origin whitelisted only.
- Rate limiting on `/auth/login` and `/auth/register`.

### Code Style — Backend
- All entities have both an internal `id` (Long, auto-increment) and a `uuid` (UUID, generated, exposed publicly).
- DTOs separate from entities — never return entity objects directly from controllers.
- Services handle business logic — controllers are thin.
- Every endpoint returns a consistent response wrapper if needed.

### Code Style — Frontend
- **All colors, fonts, spacing, border-radius, shadows, and animation timings come from `src/styles/theme.js`** — never hardcode visual values in components.
- Use the `AlertModal` component for every confirmation or destructive action — never implement inline confirms.
- No `localStorage` or `sessionStorage` for sensitive data — JWT stored in memory or httpOnly cookie.
- Components are functional with hooks — no class components.

---

## Design Tokens (theme.js summary)

Full file at `src/styles/theme.js`. Key values:

- **Background:** `#F5EDD6` (parchment)
- **Panel:** `#EDE0C4`
- **Border:** `#B8860B` (dark gold)
- **Text primary:** `#2C1A0E` (dark brown)
- **Text header:** `#B8860B` (amber)
- **HP bar:** `#C0392B` (red)
- **EN bar:** `#2980B9` (blue)
- **Header font:** Philosopher / Cinzel (serif, P4 Golden inspired)
- **Body font:** Noto Sans

---

## AlertModal Component

Location: `src/components/AlertModal.jsx`

```jsx
<AlertModal
  isOpen={bool}
  title="string"
  message="string"
  confirmLabel="string"   // e.g. "Give Up", "OK"
  cancelLabel="string"    // omit for info-only alerts
  onConfirm={fn}
  onCancel={fn}           // omit for info-only alerts
  variant="warning | info | danger"
/>
```

Use for: Give Up, Restart, session timeout, any destructive action.

---

## Auth Flow

- `POST /auth/register` — email + nickname + password → returns JWT
- `POST /auth/login` — email + password → returns JWT
- JWT sent as `Authorization: Bearer <token>` header on all protected requests
- **Session timeout:** on every page load and login, backend checks `run.last_action_at`. If `now - last_action_at > 1 hour` and a run is active → run is closed as defeat, frontend shows AlertModal (info variant) before redirecting to Game Over.
- Username = email (used for login). Display name = nickname (shown in UI).

---

## Database Schema (H2)

```
Player       — id (Long), uuid (UUID), nickname, email, password_hash, avatar_id, created_at
Run          — id (Long), uuid (UUID), player_uuid, season_uuid, started_at, ended_at,
               fights_survived, team_snapshot (JSON), last_action_at,
               end_reason ENUM(DEFEATED, GAVE_UP, TIMEOUT, RESTARTED)
RunEvent     — id (Long), uuid (UUID), run_uuid, event_type, payload (JSON), occurred_at
Season       — id (Long), uuid (UUID), name, start_date, end_date
SeasonResult — id (Long), uuid (UUID), season_uuid, player_uuid, best_run_uuid, fights_survived
```

---

## Game States (React Router)

| Route | State | Description |
|---|---|---|
| `/` | `menu` | Start / title screen |
| `/select` | `selection` | Team selection + loadout builder |
| `/battle` | `battle` | Active fight |
| `/prep` | `preparation` | Between-fight preparation phase |
| `/gameover` | `gameover` | Run ended — defeat / give up / timeout |

---

## Core Game Rules (summary)

### Stats
- **STR** → HP = STR×2, physical damage
- **DEX** → SPD = DEX×2, turn order, accuracy
- **INT** → EN = INT×2 (magic classes), magic damage
- **EN** (fighters) = DEX×2

### Class Base Stats
| Class | STR | DEX | INT | HP | SPD | EN |
|---|---|---|---|---|---|---|
| Warrior | 10 | 7 | 5 | 20 | 14 | 14 |
| Ranger | 8 | 9 | 5 | 16 | 18 | 18 |
| Mage | 6 | 6 | 10 | 12 | 12 | 20 |
| Priest | 7 | 7 | 8 | 14 | 14 | 16 |

### Damage Formulas
- Physical: `DMG = STR (+ weapon bonus) - DEF` (min 1)
- Magic: `DMG = INT (+ spell bonus) - MDEF` (min 1)

### Armor Damage Reduction
- Heavy: always −2 physical
- Medium: random −1 or −2 physical per hit
- Light: always −1 physical
- Clothes: 0 physical / Magic Clothes: −1 magic OR +1 EN

### EN Costs
- Weapon skills: 2 EN each
- Staff (Arcane Bolt) / Wand (Elemental Shot): 0 EN (auto-trigger on attack)
- Magic spells: 2 EN (status-only) / 3 EN (low dmg) / 5 EN (mid) / 6 EN (multi-target) / 7 EN (high)

### Enemy AI Targeting
- Low INT → random target
- Average INT → lowest current HP
- High INT → lowest DEF or MDEF

### Difficulty Cycle (per 3 fights)
- Fight A: enemies −2 HP or −2 EN (random)
- Fight B: no modifier
- Fight C: enemies +2 HP, +2 EN, or +1/+1 (random)
- After each full cycle: +1 enemy added (max 6)

### Monster Cap System
- Starts at 20, +5 every 3 fights
- Active pool = enemies with attribute sum (STR+DEX+INT) in range (cap−10, cap]
- If pool < 2 enemies → include tier below as fallback

### Session Timeout
- Any return after 1 hour of inactivity = automatic defeat
- Check on login and on every page load when a run is active

### Battle Screen Controls
- **Give Up button** — always visible, ends run, goes to Game Over (AlertModal confirm)
- **Restart button** — always visible, ends run, starts new run with same team at fight 1 (AlertModal confirm)

### Between-Fight Phase (per fight win)
1. Passive regen: HP +1–3 (random), EN +1–2 (random) per surviving character
2. Loot drop: one item for the group, player chooses recipient
3. Prep phase: each hero picks one action (use item / swap gear / revive ally at 1/4 HP / pass)

### Loot Rarity by Monster Tier
| Active Tier | Loot Pool |
|---|---|
| 10–25 | Common only |
| 25–35 | Common + Magic |
| 35–55 | Common + Magic + Rare |
| 55+ | Magic + Rare only |

---

## What Has Been Built (after prompts B1, B2, F1, F2)

- ✅ Spring Boot project with H2, JPA entities, CORS, security skeleton
- ✅ JWT auth endpoints (`/auth/register`, `/auth/login`)
- ✅ React project with Vite, routing, `src/styles/theme.js`
- ✅ `AlertModal` component (reusable, all variants)

## What Comes Next

| Prompt | Feature |
|---|---|
| B3 | Game Data API |
| B4 | Run Management |
| B5 | Season System (frontend placeholder only) |
| B6 | Player Profile |
| F3 | Auth Screens |
| F4 | Data Layer |
| F5 | Team Selection + Loadout |
| F6 | Battle Engine (logic) |
| F7 | Status Effect Engine |
| F8 | Battle Screen UI |
| F9 | Enemy AI |
| F10 | Item System |
| F11 | Equipment & Weapon Swap |
| F12 | Between-Fight Phase |
| F13 | Difficulty Scaling |
| F14 | Game Over & Run Summary |
| F15 | Season & Leaderboard Screen |
| F16 | Polish Pass |