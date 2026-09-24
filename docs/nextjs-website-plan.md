# Next.js Website & Web App Plan

## 1. Overview

This plan defines how to build a Next.js-based public website and web application for MsgSync, using the existing monorepo structure and the current Express-based platform backend.

## 2. Current state

- The repository is a pnpm monorepo with backend services in `packages/platform` and `packages/aggregator`.
- The existing platform exposes an API surface under `/api/*` and serves static HTML pages from `packages/platform/src/public`.
- There is a JavaScript SDK package in `packages/sdk-js` that wraps the platform REST API.
- App folders exist at `apps/www` and `apps/dev-studio`, but they currently contain only README documentation.
- The framework package supports Next.js integration implicitly through `packages/framework/next`.

## 3. Goal

Build a production-ready Next.js website and web app that:
- replaces static platform pages with modern React UI,
- consumes the existing MsgSync platform API,
- supports marketing, authentication, dashboard, campaigns, analytics, billing, and settings,
- works within the existing monorepo and uses shared packages where possible.

## 4. Scope

### Public website
- Home page
- Features page
- Pricing / plans page
- Docs and developer resources page
- Contact / get started page

### Platform web app
- Login / authentication flow
- Dashboard summary page
- Campaigns / bulk messaging management
- Contact list management
- Analytics and charts
- Billing / invoice overview
- Security / audit pages
- Settings / branding pages

## 5. API integration points

The Next.js app should integrate with the existing platform endpoints in `packages/platform`: 
- `POST /api/messages`
- `GET /api/messages`
- `POST /api/otp/send`, `POST /api/otp/verify`
- `POST /api/bulk/campaigns`, `GET /api/bulk/campaigns`
- `POST /api/bulk/campaigns/:id/start`, `pause`, `resume`, `delete`
- `GET /api/analytics/stats`, `GET /api/analytics/trends`
- `GET /api/organizations/:id`
- `GET /api/bundles`, `POST /api/bundles/subscribe`
- `GET /api/routing/providers`, `POST /api/routing`
- `GET /api/lookups/info`, `POST /api/lookups/configs`
- `GET /api/security/2fa/setup`, `POST /api/security/2fa/enable`
- `GET /api/audit`
- `GET /api/invoices`
- `POST /api/auth/verify-2fa`, `GET /api/auth/me`

## 6. Recommended app structure

Create a new Next.js app under `apps/www` (or `apps/www-next` if preserving the existing folder):

```
apps/www/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/page.tsx
│   ├── campaigns/page.tsx
│   ├── analytics/page.tsx
│   ├── billing/page.tsx
│   ├── settings/page.tsx
│   └── login/page.tsx
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── CampaignCard.tsx
│   └── AnalyticsChart.tsx
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── sdk.ts
├── public/
├── styles/
│   └── globals.css
├── package.json
├── tsconfig.json
├── next.config.mjs
└── .env.example
```

## 7. Technical approach

### 7.1 Use Next.js App Router
- Use the App Router to build a modular multi-page application.
- Prefer server-side rendering or incremental static regeneration for marketing pages.
- Use client components for dashboard interactivity and charting.

### 7.2 API client
- Create a shared API helper in `apps/www/lib/api.ts`.
- Use `fetch` or `axios` with a configurable `NEXT_PUBLIC_PLATFORM_API_BASE`.
- Include API key / bearer token handling in `lib/auth.ts`.
- Optionally reuse the JS SDK package in `packages/sdk-js` by adding browser-friendly export support.

### 7.3 Authentication
- Build a login page that calls `/api/auth/verify-2fa` or uses a platform auth flow.
- Store tokens in secure cookies or local storage as required.
- Protect app pages using middleware or a client-side auth wrapper.

### 7.4 Shared UI & design system
- Reuse `apps/design-system` if it is intended for shared UI components.
- If no common design package exists yet, start with a lightweight component library and standard CSS variables.
- Use icons from `lucide-react` or maintain the existing visual style from `packages/platform/src/public/js`.

### 7.5 Data fetching and page flows
- `dashboard` page: fetch `/api/analytics/stats`, `/api/messages`, `/api/bulk/campaigns`.
- `campaigns` page: list campaigns, create campaign form, launch/pause/resume actions.
- `analytics` page: trends charts and volume data.
- `billing` page: invoices and bundle subscriptions.
- `settings` page: branding, security, user profile.

### 7.6 Code quality
- Add TypeScript typing for API responses.
- Keep the Next.js app in the workspace so it can use pnpm workspaces.
- Add linting and formatting scripts consistent with repo conventions.

## 8. Phased implementation

### Phase 1 — Setup & scaffolding
- Add `apps/www/package.json` and `tsconfig.json`.
- Install `next`, `react`, `react-dom`, `swr`, `axios`, and any icon/chart libraries.
- Add root workspace references via `pnpm-workspace.yaml` already covering `apps/*`.
- Build the initial public homepage and `/login` page.

### Phase 2 — API integration
- Add `lib/api.ts` and connect to the backend.
- Implement the login flow and secure page access.
- Build the dashboard overview page.
- Replace one platform static page with a Next page to validate integration.

### Phase 3 — Platform web app
- Implement campaigns management, contact lists, analytics, billing, and settings.
- Add forms, data tables, and real-time charts.
- Add error handling, loading states, and user feedback.

### Phase 4 — polish and deployment
- Add responsive UI and navigation.
- Add environment config and docs for local development.
- Add a Dockerfile and/or `docker-compose` as needed for web app deployment.
- Validate end-to-end app + backend work in local dev.

## 9. Milestones

1. Working `apps/www` Next.js app with homepage and login.
2. Dashboard page consuming platform analytics and campaign data.
3. Campaign management pages with live backend CRUD actions.
4. Billing, security, and settings pages.
5. Deployment-ready build and README documentation.

## 10. Recommended next tasks

- Create the Next.js app scaffold in `apps/www`.
- Add `NEXT_PUBLIC_PLATFORM_API_BASE=http://localhost:3001/api` to `.env.example`.
- Build `lib/api.ts` and `lib/auth.ts`.
- Implement the core dashboard and campaigns page.
- Document how to run the app alongside `packages/platform`.

---

This plan gives a concrete path from the existing MsgSync platform to a modern Next.js website and web app that leverage the backend API and repository workspace.
