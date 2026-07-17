# 3JRPG — AGENTS.md

This file provides context for Codex on the 3JRPG project.
Read this before every prompt. Do not skip sections.

---

## Project Overview

**3JRPG** is a portfolio web game — an endless turn-based JRPG battle game set in a magitech world (FF6/FF7 tone, Phantasy Star visual inspiration). The player assembles a trio of heroes and fights through infinite escalating enemy encounters. HP and EN carry over between fights. Death = full reset (roguelite).

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), under `frontend/` |
| Backend | Java 17 / Spring Boot, at project root |
| Database | H2 in-memory (dev) |
| Auth | JWT via Spring Security |
| API | REST / JSON |
| Audio | Howler.js (SFX only) |

---

## Project Structure

```
3jrpg/                                  # repo root = Spring Boot project
├── pom.xml
├── src/main/java/com/jrpg/
│   ├── Jrpg3Application.java
│   ├── config/                         # SecurityConfig, CorsConfig
│   ├── auth/                           # AuthController, AuthService, JwtUtil,
│   │                                   # JwtAuthFilter, RateLimiter
│   ├── dto/                            # RegisterRequest, LoginRequest, AuthResponse
│   ├── entity/                         # Player, Run, RunEvent, Season, SeasonResult, EndReason
│   ├── repository/                     # JPA repositories (all 5 entities)
│   └── security/                       # JwtAuthenticationEntryPoint, PlayerDetailsService
├── src/main/resources/
│   └── application.properties          # H2, JWT secret, CORS origin
│
└── frontend/                           # React (Vite)
    ├── src/
    │   ├── styles/
    │   │   └── theme.js                # ALL design tokens — colors, fonts, spacing, animations
    │   ├── components/                 # Shared components (empty — AlertModal not yet built)
    │   ├── pages/                      # MenuPage, SelectionPage, BattlePage, PrepPage, GameOverPage
    │   ├── hooks/
    │   │   └── useAuth.jsx             # AuthProvider + useAuth hook (JWT in memory only)
    │   ├── services/
    │   │   ├── api.js                  # Axios instance + interceptors + auth endpoints
    │   │   └── sound.js               # Howler.js registry (no audio files yet)
    │   ├── App.jsx                     # BrowserRouter + Routes + ProtectedRoute
    │   └── main.jsx                    # Entry point
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
- All entities have both an internal `id` (Long, auto-increment) and a `uuid` (UUID, generated in `@PrePersist`, exposed publicly).
- DTOs separate from entities — never return entity objects directly from controllers.
- Services handle business logic — controllers are thin.
- Every endpoint returns a consistent response wrapper if needed.

### Code Style — Frontend
- **All colors, fonts, spacing, border-radius, shadows, and animation timings come from `src/styles/theme.js`** — never hardcode visual values in components.
- Use the `AlertModal` component for every confirmation or destructive action — never implement inline confirms.
- No `localStorage` or `sessionStorage` for sensitive data — JWT stored in memory only (`useAuth.jsx`).
- Components are functional with hooks — no class components.

---

## Design Tokens (theme.js summary)

Full file at `frontend/src/styles/theme.js`. Key values:

- **Background:** `#F5EDD6` (parchment)
- **Panel:** `#EDE0C4`
- **Border:** `#B8860B` (dark gold)
- **Text primary:** `#2C1A0E` (dark brown)
- **Text header:** `#B8860B` (amber)
- **HP bar:** `#C0392B` (red)
- **EN bar:** `#2980B9` (blue)
- **Header font:** Philosopher / Cinzel (serif)
- **Body font:** Noto Sans

---

## AlertModal Component

**Built.** Location: `frontend/src/components/AlertModal.jsx`

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

- `POST /auth/register` — email + nickname + password → returns `{ token, nickname, avatarId, playerUuid }`
- `POST /auth/login` — email + password → returns `{ token, nickname, avatarId, playerUuid }`
- JWT subject = `playerUuid` (UUID string); claims include `nickname` and `avatarId`
- JWT sent as `Authorization: Bearer <token>` header on all protected requests
- `GET /auth/session-check` — protected; returns `{ timeout: bool, fightsSurvived?: int }`
- **Session timeout:** backend closes active run as TIMEOUT if `lastActionAt` is more than 1 hour ago. Frontend shows AlertModal (info variant) before redirecting to Game Over.
- Username = email (used for login). Display name = nickname (shown in UI).
- On 401 response: `api.js` interceptor clears the token and redirects to `/`.
- Rate limit: 10 requests/min per IP on `/auth/register` and `/auth/login` (in-memory, no external library).

---

## Database Schema (H2)

```
Player       — id (Long), uuid (UUID), nickname, email, password_hash, avatar_id, created_at
Run          — id (Long), uuid (UUID), player_uuid, season_uuid, started_at, ended_at,
               fights_survived, team_snapshot (TEXT/JSON), last_action_at,
               end_reason ENUM(DEFEATED, GAVE_UP, TIMEOUT, RESTARTED)
RunEvent     — id (Long), uuid (UUID), run_uuid, event_type, payload (TEXT/JSON), occurred_at
Season       — id (Long), uuid (UUID), name, start_date, end_date
SeasonResult — id (Long), uuid (UUID), season_uuid, player_uuid, best_run_uuid, fights_survived
```

---

## Game States (React Router)

| Route | Page | Description |
|---|---|---|
| `/` | `MenuPage` | Start / title screen (public) |
| `/login` | `LoginPage` | Login form (public only) |
| `/register` | `RegisterPage` | Registration form (public only) |
| `/select` | `SelectionPage` | Team selection + loadout builder (protected) |
| `/battle` | `BattlePage` | Active fight (protected) |
| `/prep` | `PrepPage` | Between-fight preparation phase (protected) |
| `/gameover` | `GameOverPage` | Run ended — defeat / give up / timeout (protected) |
| `/season` | `SeasonPage` | Season leaderboard + player rank + history (protected) |

Unknown routes redirect to `/`. Unauthenticated access to protected routes redirects to `/login`.

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

## What Has Been Built

### Backend
- ✅ Spring Boot project — H2, JPA entities, CORS, Spring Security
- ✅ JWT auth endpoints (`/auth/register`, `/auth/login`, `/auth/session-check`)
- ✅ In-memory rate limiter (10 req/min per IP on auth endpoints)
- ✅ Game Data API (`src/main/java/com/jrpg/gamedata/`) — classes, enemies, items, spells, weapons, armor, augmentations, status effects loaded from JSON
- ✅ Run & Battle API (`src/main/java/com/jrpg/battle/`) — `BattleController`, `BattleService`, `GameLogicService`, `MonsterCapService`, `LootService`; full battle state, give up, restart, prep phase, loot assign, player profile

### Frontend — Infrastructure
- ✅ React + Vite project — routing, `ProtectedRoute`, `PublicOnlyRoute`, `theme.js`
- ✅ `useAuth.jsx` — in-memory JWT, `AuthProvider`, `login()`, `logout()`
- ✅ `services/api.js` — Axios + Bearer interceptor + 401 redirect; all run/battle/profile/season endpoints
- ✅ `services/sound.js` — Howler.js registry (no audio files yet)
- ✅ `AlertModal` component (`frontend/src/components/AlertModal.jsx`)
- ✅ `NavBar` component — sticky top nav, shows when authenticated; links to /select, /season; logout

### Frontend — Data Layer (`frontend/src/data/`)
- ✅ `classes.js` — CLASS_LIST (4 classes, colorKey, equippableWeapons, equippableArmor)
- ✅ `augmentations.js` — AUGMENTATION_LIST (natural / cyber / enhanced, with advantages)
- ✅ `weapons.js` — WEAPON_LIST (equippableBy, skills, mageSpec)
- ✅ `armor.js` — ARMOR_LIST (tier, DEF, MDEF)
- ✅ `spells.js` — SPELL_LIST (school, targetType, cost), MAGE_SPECIALIZATIONS
- ✅ `items.js` — ITEM_LIST (usableIn, effect)
- ✅ `statusEffects.js` — STATUS_EFFECTS (12 statuses, type, colorKey)
- ✅ `enemies.js` — ENEMY_TYPE_LABELS, ENEMY_TYPE_COLORS, AI_TIER_LABELS
- ✅ `avatars.js` — AVATAR_LIST (10 avatars matching backend)
- ✅ `gameConstants.js` — MAX_HEROES, MAX_ENEMIES, END_REASONS, QUALITY_LABELS/COLORS, ARMOR_TIER_LABELS

### Frontend — Pages & Components
- ✅ `LoginPage` + `RegisterPage` — auth forms with error handling (F3)
- ✅ `SelectionPage` + 5 sub-components — step-wizard hero config (class → augment → mageSpec → loadout → items), team summary, Start Run (F5)
  - `HeroSlot`, `ClassPicker`, `AugmentationPicker`, `LoadoutBuilder`, `ItemStarter`, `TeamSummary`
- ✅ `BattlePage` + 6 sub-components — full battle UI with action menu, targeting state machine, turn order bar, combat log, give up / restart (F6/F8)
  - `ActionMenu`, `HPBar`, `StatusBadge`, `EnemyPanel`, `TurnOrderBar`, `CombatLog`
- ✅ `PrepPage` + 2 sub-components — regen display, loot assignment, hero prep actions (use item / swap gear / revive / pass) (F12)
  - `HeroPrepSlot`, `LootDropPanel`
- ✅ `GameOverPage` + 3 sub-components — run summary, personal best, share panel, new run same team (F14)
  - `EndReasonBadge`, `RunSummaryCard`, `SharePanel`
- ✅ `SeasonPage` + 5 sub-components — current season, leaderboard with pagination, player rank, past seasons (F15)
  - `SeasonHeader`, `LeaderboardTable`, `LeaderboardRow`, `PlayerRankBanner`, `SeasonHistoryList`

## What Comes Next

| Prompt | Feature |
|---|---|
| F16 | Polish Pass |
