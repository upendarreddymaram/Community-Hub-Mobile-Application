# Community Hub Mobile Application

A production-oriented React Native application for browsing, joining, and participating in online communities. The app loads **live community and post data** from the public Discourse Meta API, combines it with **local membership and user-authored posts**, and is designed for **offline resilience**, **clear architecture**, and **maintainability**.

---

## Setup Instructions

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 22+ |
| npm | 10+ |
| Android Studio | For Android emulator or device |
| Xcode + CocoaPods | macOS only, for iOS simulator |

### Installation

```bash
git clone <https://github.com/upendarreddymaram/Community-Hub-Mobile-Application.git>
cd community_app
npm install

# iOS only (first time or after native dependency changes)
cd ios && pod install && cd ..
```

### Running the Application

Use two terminals:

```bash
# Terminal 1 — Metro bundler
npm start

# Terminal 2 — run on a device or emulator
npm run android    # Android
npm run ios        # iOS (macOS only)
```

If Metro serves stale bundles after dependency changes:

```bash
npm start -- --reset-cache
```

### Environment Configuration

No external API keys are required for the default setup.

Configuration lives in **`src/config/env.ts`**. React Native does not load `.env` at runtime in this project; `.env.example` documents the variable names for reference only.

```bash
cp .env.example .env   # optional reference
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `DISCOURSE_BASE_URL` | `https://meta.discourse.org` | Base URL for live read API (communities & posts) |
| `USER_AGENT` | `CommunityHubApp/1.0 (...)` | Identifies the app to Discourse |

To point at a different Discourse instance, edit `src/config/env.ts` and rebuild.

**Data sources at a glance:**

- **Authentication** — mocked local login (no external auth service).
- **Communities & posts (reads)** — live from the public [Discourse Meta API](https://meta.discourse.org/site.json).
- **Join/leave & user-created posts (writes)** — stored locally on-device with offline queue support. See [Why writes are local-only](#why-writes-are-local-only).

**Demo credentials** (use “Fill demo credentials” on the login screen):

| Email | Password |
|-------|----------|
| `demo@communityhub.com` | `Password123!` |
| `admin@communityhub.com` | `Admin123!` |

### Quality Scripts

```bash
npm run typecheck   # TypeScript (strict)
npm run lint        # ESLint + Prettier rules
npm run lint:fix    # Auto-fix lint issues
npm run format      # Prettier write
npm test            # Jest unit + integration tests
npm run test:ci     # CI-friendly test run (used in GitHub Actions)
```

### Testing

```bash
npm test
```

| Suite | Coverage |
|-------|----------|
| `__tests__/utils/*` | Validation, HTML strip, community sort, analytics helper |
| `__tests__/api/discourseApi.test.ts` | Discourse → app model mappers |
| `__tests__/api/discourseApi.integration.test.ts` | Fetch layer with MSW |
| `__tests__/api/communitiesApi.offline.test.ts` | Offline list fallback |
| `__tests__/store/offlineQueueStore.test.ts` | Offline queue rules |
| `__tests__/App.test.tsx` | App smoke render |

CI (`.github/workflows/ci.yml`) runs **lint**, **typecheck**, and **test** on every push/PR to `main`.

---

## Architecture Overview

### Project Structure

Feature-based layout keeps screens, hooks, API, and UI colocated per domain. Shared infrastructure sits at the root of `src/`.

```
community_app/
├── android/                    # Native Android project
├── ios/                        # Native iOS project
├── __tests__/                  # Jest unit & integration tests
├── src/
│   ├── api/                    # HTTP client, Discourse API, auth interceptor
│   ├── config/                 # Runtime env (Discourse URL, user agent)
│   ├── features/
│   │   ├── auth/               # Login, profile, auth store, auth API
│   │   ├── communities/        # List, detail, join/leave, community UI
│   │   └── posts/              # Post list, create/edit, local post storage
│   ├── components/common/      # Shared UI (Button, Input, dialogs, skeletons)
│   ├── hooks/                  # Cross-cutting hooks (network, offline sync, layout)
│   ├── navigation/             # Root / Auth / Main stacks, navigation ref
│   ├── providers/              # Query client, theme, API auth bootstrap
│   ├── store/                  # Offline action queue (Zustand)
│   ├── theme/                  # Colors, spacing, typography
│   ├── types/                  # Shared TypeScript models & navigation types
│   └── utils/                  # Validation, storage, analytics, constants
├── App.tsx                     # Entry — mounts AppProviders
└── README.md
```

**Layering convention:**

| Layer | Responsibility |
|-------|----------------|
| **Screens** | Compose UI, wire navigation, delegate to hooks |
| **Hooks** | React Query / Zustand; expose loading, error, mutation state |
| **API services** | HTTP calls, local persistence, Discourse mapping |
| **Components** | Presentational, memoized where lists are involved |

### State Management Approach

| Concern | Tool | Used for |
|---------|------|----------|
| **Server/async state** | TanStack React Query v5 | Communities, posts, pagination, cache, optimistic mutations |
| **Auth session** | Zustand + AsyncStorage + Keychain | Login state, token (encrypted), profile |
| **Joined communities** | Zustand + AsyncStorage | Local membership flags merged into API data |
| **Offline write queue** | Zustand + AsyncStorage | Join, leave, create-post actions when offline |
| **UI theme** | React Context (`ThemeProvider`) | System light/dark colors |

**Why not Redux or Context-only?**

- Most state is **server-driven** with pagination, stale-while-revalidate, and invalidation — React Query handles this with less boilerplate than Redux Toolkit.
- Auth and the offline queue are **small, synchronous-after-hydration** slices — Zustand is sufficient without global re-render cost of Context.
- Context alone would require custom cache, pagination, and persistence logic that React Query already provides.

### Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Screen    │ ──▶ │ Custom Hook  │ ──▶ │ API Service │ ──▶ │ Discourse API    │
│             │     │ (React Query │     │             │     │ (reads)          │
│             │     │  / Zustand)  │     │             │     └──────────────────┘
└─────────────┘     └──────────────┘     └──────┬──────┘
       ▲                    ▲                   │
       │                    │                   ▼
       │                    │            ┌──────────────────┐
       │                    └────────────│ AsyncStorage /   │
       │                                 │ Keychain         │
       └─────────────────────────────────│ (cache, drafts,  │
                                         │  queue, session) │
                                         └──────────────────┘
                                                ▲
                                         ┌──────┴──────┐
                                         │   NetInfo   │
                                         │ (connectivity)
                                         └─────────────┘
```

**Flows in detail:**

1. **Auth** — Login validates locally → mock API returns token → token stored in Keychain, profile in AsyncStorage → `RootNavigator` gates Auth vs Main flow after hydration.
2. **Communities** — Infinite query fetches Discourse categories; search/sort/joined filters applied client-side; join state merged from local store.
3. **Community detail** — Detail query + infinite posts query; local user posts prepended; join/leave via optimistic mutations.
4. **Create / edit post** — Optimistic list update, draft auto-save, offline enqueue when disconnected.
5. **Navigation** — Typed native stacks; session change resets navigation stack to prevent stale routes after logout.

### Offline Strategy

| Mechanism | Implementation |
|-----------|----------------|
| **Connectivity detection** | `@react-native-community/netinfo` via `useNetworkStatus` |
| **Read cache** | React Query + AsyncStorage persister (24h `maxAge`, `networkMode: 'offlineFirst'`) |
| **List snapshot fallback** | `communitiesSnapshot` utility when query cache is empty offline |
| **Write queue** | Zustand store persists join / leave / create-post actions |
| **Sync on reconnect** | `useOfflineSync` processes queue sequentially; invalidates affected queries |
| **Optimistic UI** | Mutations update cache immediately; rollback on failure when online |
| **Draft persistence** | Post title/body debounced to AsyncStorage (500ms) |
| **User feedback** | `OfflineSyncBanner` on list, detail, profile; inline `ErrorView` with retry |
| **Cache restore gate** | `useIsRestoring()` blocks queries until persisted cache is hydrated |

Offline join/leave skips network calls, updates local caches fully, and does not surface error UI — actions queue silently until sync.

---

## Key Decisions & Tradeoffs

### Major Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | React Native CLI 0.86 | Full native project control; standard path to Play Store / App Store builds |
| **Feature folders** | `src/features/{auth,communities,posts}` | Scales by domain; keeps related code discoverable |
| **Navigation** | React Navigation 7 native stack | Typed params, session-based flow reset, minimal complexity for assignment scope |
| **List rendering** | Shopify FlashList | Better recycling vs FlatList for community and post feeds |
| **API reads** | Discourse Meta public API | Real network data without hosting a backend |
| **API writes** | Local persistence + queue | Discourse writes require authenticated API keys (see below) |
| **Error containment** | Root + screen-level `ErrorBoundary` | Render crashes isolated; query errors use inline retry UI |

### Library Choices

| Library | Role |
|---------|------|
| `@tanstack/react-query` | Server state, infinite queries, mutations, cache |
| `@tanstack/react-query-persist-client` | Offline read cache across app restarts |
| `zustand` | Auth, joined communities, offline queue |
| `@react-navigation/native` | Navigation and screen tracking hook point |
| `@shopify/flash-list` | High-performance lists |
| `@react-native-async-storage/async-storage` | JSON cache, drafts, queue |
| `react-native-keychain` | Encrypted auth token storage |
| `@react-native-community/netinfo` | Online/offline detection |
| `eslint` + `prettier` | Lint and format (flat ESLint config) |
| `jest` + `msw` | Unit tests and API integration tests |

### Tradeoffs Made During Implementation

| Area | Tradeoff |
|------|----------|
| **Discourse writes** | Local-only membership and posts instead of provisioning Discourse API keys — prioritizes offline UX and architecture clarity over full backend sync |
| **Client-side search/filter** | ~45 Discourse categories filtered in-app — simple and fast today; would move to server-side search at scale |
| **No tab navigator** | Single stack per flow — fewer navigation edge cases; profile accessed from list header avatar |
| **Mutation invalidation** | Post mutations invalidate on settle — extra refetch cost in exchange for consistent cache after sync |
| **Analytics** | Thin `analytics.ts` abstraction with dev console logging — swappable for Firebase/Amplitude without SDK lock-in today |
| **No E2E (Detox)** | Jest + MSW covers logic and API mapping; E2E deferred due to emulator CI cost |

### Why writes are local-only

Discourse **read** endpoints (`/site.json`, `/c/{slug}/{id}.json`) are public. **Write** operations (join category, create topic) require an authenticated Discourse user session and API key — not available in this assignment without hosting your own instance and provisioning credentials.

This app deliberately:

1. Loads **real live data** from Discourse Meta for communities and posts.
2. Persists **join/leave** and **user-created posts** locally with offline queue and optimistic UI.
3. Documents the boundary so offline resilience and architecture can be evaluated separately from Discourse admin setup.

For production, replace `communitiesApi.joinCommunity` / `postsApi.createPost` implementations with authenticated Discourse POST endpoints behind the same React Query mutation layer.

### Assumptions

- **Auth** is mock/local; no OAuth or external identity provider.
- **Communities and posts (reads)** require network at least once to populate cache; cached data shown when offline afterward.
- **Join/leave and user posts** are device-local and not synced to Discourse.
- **Single user session** per device; no multi-account switching.
- **Post drafts** auto-save locally; clearing app data clears drafts and queue.
- **System theme** follows device light/dark mode; no in-app theme toggle.
- **Discourse Meta** remains reachable and its public API shape is stable.

---

## Features Implemented

- [x] Mock authentication with validation and session persistence (Keychain token)
- [x] Live community list from Discourse API with search, sort, and joined filter
- [x] Community detail with stats, posts, join/leave (optimistic + retry)
- [x] Create and edit local posts with validation and duplicate-submit guard
- [x] Delete local posts with confirmation dialog and animation
- [x] Post draft auto-save across reloads
- [x] Offline detection, cached reads, queued writes, sync retry UI
- [x] Loading, empty, and error states throughout
- [x] System dark mode (follows device theme)
- [x] FlashList with memoized cards and debounced search (isolated from list re-renders)
- [x] Unit and integration tests; GitHub Actions CI
- [x] ESLint + Prettier
- [x] Error boundaries (app root + community detail)
- [x] Accessibility labels on primary interactive elements
- [x] Skeleton loading states
- [x] Tablet-friendly centered layout (max 720px)
- [x] Minimal analytics (`trackScreen` / `trackEvent`) with dev logging

---

## Evaluation Criteria

How this submission maps to the stated evaluation areas:

| Criterion | How it is addressed |
|-----------|---------------------|
| **Architecture and scalability** | Feature-based modules, clear screen → hook → API layering, typed navigation, swappable analytics and API sinks |
| **State management quality** | React Query for async/server state; Zustand for small client slices; narrow selectors; optimistic mutations with rollback |
| **API integration patterns** | Centralized HTTP client + auth interceptor; Discourse mappers isolated in `discourseApi.ts`; MSW integration tests |
| **Offline and error handling** | Persisted query cache, write queue, sync hook, snapshot fallback, banners, ErrorBoundary, inline retry |
| **Performance awareness** | FlashList, `React.memo` on list items, debounced search isolated from list, `useCallback`/`useMemo`, skeleton loaders |
| **Code readability and maintainability** | Strict TypeScript, ESLint/Prettier, extracted components (`PostForm`, detail subcomponents), no dead code |
| **User experience quality** | Optimistic updates, success/delete animations, confirm dialogs, offline banners, pull-to-refresh, infinite scroll |
| **Technical decision-making** | Documented tradeoffs (local writes, library choices); assumptions stated explicitly |
| **Overall production readiness** | CI pipeline, secure token storage, error boundaries, env config, README, test coverage for critical paths |

---

## Future Improvements

With additional time, priority extensions would be:

1. **E2E tests (Detox)** — Login → browse → join → create post on real emulators
2. **Authenticated Discourse writes** — Replace local-only mutations with real API sync
3. **Production analytics** — Plug Firebase Analytics or Amplitude into `setAnalyticsSink()`
4. **Crash reporting** — Sentry for production error monitoring (separate from analytics)
5. **Component tests** — React Testing Library for `PostForm`, `CommunityCard`, navigation flows
6. **Accessibility audit** — Screen reader pass on Profile, empty/error states, live regions for form errors
7. **Background sync** — Process offline queue with conflict resolution when app is backgrounded
8. **EAS Build / native CI** — Automated signed builds in GitHub Actions

---

## Submission Notes

This submission prioritizes a **clean, reliable, and thoughtfully engineered** mobile client over feature breadth.

**What evaluators should focus on:**

- Navigate **Communities → Detail → Create Post** while online, then toggle airplane mode to observe cached reads and queued writes.
- Use demo credentials on the login screen; sign out from Profile to verify navigation reset.
- Run `npm run lint`, `npm run typecheck`, and `npm run test:ci` to verify quality gates.
- In dev, watch Metro logs for `[Analytics]` screen and event lines.

**Known limitations (by design):**

- User-created posts and membership are **not visible to other Discourse users**.
- First offline launch before any successful fetch shows an empty-state message with retry.
- E2E and production analytics SDKs are intentionally out of scope.

**Focus delivered:** architecture clarity, offline resilience, performance-conscious lists, typed and tested core logic, and documentation of every major assumption.

---

## License

MIT
