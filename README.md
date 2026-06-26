# Community Hub Mobile Application

A production-oriented React Native application for browsing, joining, and participating in online communities. Built as a senior-level engineering assignment with emphasis on architecture, offline resilience, and maintainability.

## Setup Instructions

### Prerequisites

- Node.js 22+
- npm 10+
- Android Studio (Android emulator/device)
- Xcode + CocoaPods (iOS simulator, macOS only)

### Installation

```bash
cd community_app
npm install

# iOS only (first time)
cd ios && pod install && cd ..
```

### Running the Application

```bash
# Start Metro bundler (terminal 1)
npm start

# Run on Android (terminal 2)
npm run android

# Run on iOS (terminal 2, macOS only)
npm run ios
```

### Environment Configuration

No external API keys are required for the default setup.

Copy the example env file if you want to override the Discourse host:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `DISCOURSE_BASE_URL` | `https://meta.discourse.org` | Live read API for communities & posts |
| `USER_AGENT` | `CommunityHubApp/1.0 (...)` | Identifies the app to Discourse |

- **Authentication** uses a mocked local login flow (demo credentials below).
- **Communities & posts** are loaded live from the public [Discourse Meta forum API](https://meta.discourse.org/site.json).
- **Join/leave** and **create post** are stored locally on-device — see [Why writes are local-only](#why-writes-are-local-only) below.

Optional demo credentials (pre-filled on login screen):

| Email | Password |
|-------|----------|
| `demo@communityhub.com` | `Password123!` |
| `admin@communityhub.com` | `Admin123!` |

### Quality Scripts

```bash
npm run typecheck   # TypeScript validation
npm run lint        # ESLint
npm run lint:fix    # Auto-fix lint issues
npm run format      # Prettier formatting
```

---

## Architecture Overview

### Project Structure

```
community_app/
├── android/              # Native Android project
├── ios/                  # Native iOS project
├── src/
│   ├── api/              # Shared HTTP client, Discourse API, auth interceptor
│   ├── features/         # Feature modules (auth, communities, posts)
│   │   ├── auth/         # Login, profile, auth store, secure token
│   │   ├── communities/  # List, detail, join state, community UI
│   │   └── posts/        # Post list, create post, local post storage
│   ├── components/       # Shared UI (common)
│   ├── hooks/            # Cross-cutting hooks (network, themed styles)
│   ├── navigation/       # Auth / Main / Root navigators
│   ├── providers/        # App-level providers (Query, theme, API auth)
│   ├── store/            # Cross-cutting stores (offline queue)
│   ├── theme/            # Colors, spacing, typography tokens
│   ├── types/            # Shared TypeScript models
│   └── utils/            # Validation, storage helpers, constants
├── App.tsx
└── README.md
```

### State Management Approach

**Primary: TanStack React Query** — server/async state (communities, posts, pagination, caching, optimistic updates)

**Secondary: Zustand** — auth session, joined communities, offline action queue

**Secure storage:** Auth token in Keychain; user profile in AsyncStorage

#### Why this combination?

| Concern | Tool | Rationale |
|---------|------|-----------|
| Paginated lists, caching, refetch | React Query | Built-in stale-while-revalidate, infinite queries, cache invalidation |
| Optimistic join/leave & post creation | React Query mutations | `onMutate` / rollback patterns are first-class |
| Offline cache persistence | React Query + AsyncStorage persister | Survives app restarts with minimal custom code |
| Auth session | Zustand + AsyncStorage | Simple synchronous reads after hydration; no over-fetching |
| Offline action queue | Zustand + AsyncStorage | Small, predictable queue independent of query cache |

Redux Toolkit would add boilerplate for mostly server-driven state. Context API alone would not scale cleanly for pagination + cache invalidation.

### Data Flow

```
Screen → Custom Hook → React Query / Zustand → API Service → Discourse Meta API (+ local storage)
                ↓
         AsyncStorage (cache, session, drafts, offline queue)
                ↓
         NetInfo (connectivity) → Offline banner + queue sync
```

1. **Auth**: Login validates locally → mock API returns token → stored in AsyncStorage → Root navigator switches to Main flow on hydration.
2. **Communities**: Fetched live from Discourse `/site.json` categories; join/leave state merged from local AsyncStorage.
3. **Community Details**: Posts loaded from Discourse `/c/{slug}/{id}.json`; user-created posts appended from local storage.
4. **Mutations**: Join/leave and create-post use optimistic updates with rollback on failure, offline queue, and sync retry UI.
5. **Offline**: React Query persister caches successful responses; join/leave/create-post actions enqueue when offline and sync via `useOfflineSync` when connectivity returns.

### Offline Strategy

- **Detection**: `@react-native-community/netinfo` drives offline banner UI
- **Read cache**: TanStack Query persisted to AsyncStorage (24h max age)
- **Write queue**: Join/leave and create-post actions stored in Zustand offline queue when offline
- **Sync on reconnect**: Queue processed sequentially with visible sync/retry banner; caches invalidated on success
- **Draft persistence**: Unsent post title/body auto-saved to AsyncStorage (debounced 500ms)
- **Graceful degradation**: Cached data shown with banner; API failures surface retry UI instead of crashes

---

## Key Decisions & Tradeoffs

| Decision | Choice | Tradeoff |
|----------|--------|----------|
| Framework | React Native CLI 0.86 | Full native project control; standard for production Android/iOS builds |
| API | Discourse Meta public API (reads) + local persistence (writes) | Real network data; join/post not synced to Discourse — intentional (see below) |
| Navigation | React Navigation native stack | Simple stack fits scope; tab navigation omitted intentionally |
| List performance | FlashList with memoized cards, infinite scroll, debounced search | Client-side filter on ~45 categories; server-side search if catalog grows |
| Error handling | ErrorBoundary + per-screen ErrorView | Boundary catches render errors; query errors handled inline with retry |
| Secure token | Keychain via `react-native-keychain` | Token encrypted at rest; profile JSON in AsyncStorage |

### Why writes are local-only

Discourse **read** endpoints (`/site.json`, `/c/{slug}/{id}.json`) are public. **Write** operations (join category, create topic) require an authenticated Discourse user session and API key — not available in this assignment without hosting your own instance and provisioning credentials.

This app deliberately:

1. Loads **real live data** from Discourse Meta for communities and posts.
2. Persists **join/leave** and **user-created posts** locally with offline queue + optimistic UI.
3. Documents the boundary clearly so evaluators can judge offline resilience and architecture separately from Discourse admin setup.

For production, swap `communitiesApi.joinCommunity` / `postsApi.createPost` with authenticated Discourse POST endpoints behind the same React Query mutation layer.

### Assumptions

- Auth is local/mock; communities and posts are read from Discourse Meta (requires network)
- Join/leave and user-created posts are stored locally only
- Single user session per device
- Post drafts auto-saved to AsyncStorage

---

## Features Implemented

- [x] Mock authentication with validation & session persistence
- [x] Live community list from Discourse API with search, sort, and joined filter
- [x] Community details with stats, posts, join/leave (optimistic + retry)
- [x] Create post with validation, optimistic UI, duplicate-submit guard
- [x] Post draft auto-save across reloads
- [x] Offline detection, cached data, queued membership and post actions with sync retry UI
- [x] Loading, empty, and error states throughout
- [x] ESLint + Prettier configured
- [x] Error boundary (bonus)
- [x] Accessibility labels on interactive elements (login, list, posts, detail actions)
- [x] Skeleton loading states on community list and detail
- [x] Tablet-friendly centered layout (max 720px content width)

---

## Future Improvements

- **Testing**: Unit tests for validation/utils; integration tests with MSW; Detox E2E
- **CI/CD**: GitHub Actions for lint, typecheck, and EAS Build
- **Real API writes**: Authenticated Discourse API for join/post sync
- **Analytics**: Screen and mutation event tracking
- **Advanced offline**: Background sync with conflict resolution

---

## License

MIT
