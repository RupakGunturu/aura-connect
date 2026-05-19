# Vault — Privacy Messaging MVP

## Scope (this iteration)

**In:** Landing page, signup/login, profile (avatar + bio), conversation list, 1:1 real-time chat with typing indicators + read receipts + presence (online/offline), dark theme (matches the chosen "Minimal glass" direction).

**Out (next iterations):** posts/feed, stories, follows, comments, reactions, voice/video calls, screen sharing, disappearing messages, true client-side E2E. Security for this MVP = TLS in transit + bcrypt password hashing + JWT auth + at-rest DB encryption (MongoDB Atlas default).

## Important: two repos

You chose Express + MongoDB + Socket.io. Lovable's runtime can only host the frontend (it runs on Cloudflare Workers — Socket.io's long-lived stateful connections won't work there). So I'll deliver:

1. **Frontend in this Lovable project** — React + TanStack Start + Tailwind, talks to your backend over `VITE_API_URL` / `VITE_SOCKET_URL`.
2. **Backend as a downloadable starter** — generated as a zip in `/mnt/documents/vault-backend.zip`, ready to push to GitHub and deploy to Render. You connect it to MongoDB Atlas yourself.

Until the backend is deployed, the frontend will run against a configurable URL — easy to point at `localhost:4000` during local dev, then at your Render URL.

## Frontend (this repo)

### Routes
```text
/                          Landing (hero + workspace mockup + footer)
/login                     Login form
/signup                    Signup form (email, password, handle)
/onboarding                Avatar upload + bio (post-signup)
/_authenticated/app        Layout: 16px icon rail + 288px conversation list + chat pane
  /chat                      Empty state ("Pick a conversation")
  /chat/$conversationId      Active thread
/_authenticated/profile/$handle   Profile page (avatar, bio, presence)
/_authenticated/settings   Theme toggle, logout, change password
```

`_authenticated` layout uses `beforeLoad` to redirect unauthenticated users to `/login` and stores the JWT + decoded user in router context.

### Design tokens (verbatim from chosen direction)
- Background: `#09090b` (zinc-950)
- Brand: `#10b981` (emerald)
- Glass surface: `rgba(24,24,27,0.4)` + `backdrop-filter: blur(24px)`
- Font: Inter (variable, optical sizing)
- Bubbles: 16px radius, asymmetric corner cut on sender side, brand-tinted for "me"
- Borders: `white/5` and `white/10`, no hard 1px lines

### Component structure
```text
src/components/
  chat/
    ConversationList.tsx        glass sidebar with presence dots
    ChatHeader.tsx              name + E2E badge
    MessageBubble.tsx           me/them variants, status ticks
    MessageList.tsx             grouped by day, auto-scroll
    TypingIndicator.tsx         3-dot bounce
    MessageComposer.tsx         input + send + attach
  layout/
    AppShell.tsx                icon rail + sidebar + outlet
    NavRail.tsx                 chat/profile/settings icons + avatar
  auth/
    AuthForm.tsx                shared login/signup form
  ui/                           (existing shadcn)
src/lib/
  api.ts                        fetch wrapper, attaches JWT
  socket.ts                     socket.io-client singleton
  auth-context.tsx              JWT storage, current user, login/logout
  zod-schemas.ts                signup/login/message validation
```

### Real-time wiring
- On login → store JWT in `localStorage` + memory; connect Socket.io with `auth: { token }`.
- Socket events consumed: `message:new`, `message:status` (delivered/read), `typing:start`, `typing:stop`, `presence:update`.
- Socket events emitted: `message:send`, `typing:start`, `typing:stop`, `message:read`.
- Reconnect handling: presence flips to offline on disconnect; on reconnect, refetch last 50 messages of active thread.

### Validation (Zod, client + server)
- email: trimmed, lowercase, valid email, ≤255
- password: ≥8, ≤72 (bcrypt limit)
- handle: `^[a-z0-9_]{3,20}$`
- message body: 1–4000 chars

## Backend starter (zip)

Generated once via `code--exec` into `/mnt/documents/vault-backend.zip`. Structure:

```text
vault-backend/
  src/
    index.ts                 express + http + socket.io bootstrap
    config/env.ts            zod-validated env
    db/mongoose.ts           Atlas connection
    models/
      User.ts                email, passwordHash, handle, avatarUrl, bio, lastSeen
      Conversation.ts        participants[2], lastMessageAt
      Message.ts             conversation, sender, body, status, createdAt
    middleware/
      auth.ts                JWT bearer verify
      rateLimit.ts           express-rate-limit on auth + send
    routes/
      auth.ts                POST /signup /login, GET /me
      users.ts               GET /users/:handle, PATCH /me (bio/avatar)
      conversations.ts       GET / POST (open or create 1:1)
      messages.ts            GET /conversations/:id/messages?cursor=
    sockets/
      index.ts               auth middleware, room per conversation
      handlers.ts            send / typing / read / presence
  package.json               express, mongoose, socket.io, bcrypt, jsonwebtoken, zod, helmet, cors, express-rate-limit
  tsconfig.json
  .env.example               MONGODB_URI, JWT_SECRET, CORS_ORIGIN, PORT
  render.yaml                one-click Render web service
  README.md                  local dev + Render + Atlas steps
```

Security defaults: `helmet()`, strict CORS to `CORS_ORIGIN`, bcrypt cost 12, JWT 7-day expiry, rate-limit auth (10/min/IP) and message send (60/min/user).

## Technical notes

- **No Lovable Cloud** — per your choice. I'll add `VITE_API_URL` and `VITE_SOCKET_URL` to `.env.example` in the frontend; you fill them after deploying the backend.
- **TanStack Start** still does SSR for marketing pages (`/`, `/login`, `/signup`); the chat shell is client-rendered after auth, since Socket.io is browser-only.
- **Avatar uploads** in this MVP go base64 → `users.avatarUrl` (small images only). Switch to S3/R2 in a follow-up.
- **Why not Lovable Cloud's realtime instead?** It would be simpler and free of the deployment chore — happy to switch if you reconsider, just say the word.

## Out-of-scope reminders

I will not build feed, stories, follows, posts, voice/video, or true client-side E2E in this iteration. After you approve, the next plan can add them.

## Deliverables checklist

- [ ] Frontend routes, components, auth context, socket client, design tokens applied
- [ ] Hero images for landing via `imagegen` (no placeholder divs in production)
- [ ] `vault-backend.zip` in `/mnt/documents/` with full README
- [ ] Frontend works against `localhost:4000` out of the box once you `npm i && npm run dev` the backend
