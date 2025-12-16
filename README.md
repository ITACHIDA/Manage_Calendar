# Manage Calendar (Outlook via Microsoft Graph)

Next.js app that connects to Outlook using Microsoft Graph (no embeds/ICS) with NextAuth + Prisma (SQLite by default).

### Env required
```
MS_CLIENT_ID=...
MS_CLIENT_SECRET=...
MS_TENANT_ID=common
MS_REDIRECT_URI=http://localhost:3000/api/auth/callback/azure-ad
DATABASE_URL="file:./dev.db"
```

### Run locally
```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

### How it works
- Sign in with Outlook (Azure AD v2) to grant `Calendars.Read` + `offline_access`.
- Access/refresh tokens are stored via NextAuth + Prisma.
- `/api/calendar/outlook` fetches events from Graph; frontend polls on focus and every 5 minutes. Switch to webhooks when ready.
