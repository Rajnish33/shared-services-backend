# NPST Shared Services Backend (Branding-first starter)

NestJS + TypeORM + MySQL backend for the existing NPST Shared Services React/Vite frontend.

## Included now
- MySQL 8.4 via Docker Compose (host port 3309; does not collide with the existing POC databases on 3307/3308).
- NestJS API on port 8001, Swagger at `/docs`, health at `/api/v1/health`.
- Branding draft persistence, version listing, and webhook publishing to People OS and HelpDesk.
- Application registry seeded from environment variables.
- Mock identity endpoint for local-only development.

## Not production-ready yet
`MOCK_AUTH_ENABLED=true` and `x-mock-user` are development scaffolding only. Do not expose this backend to a network or production. Before production, integrate Keycloak OIDC/JWT validation, role guards, secure session handling, secret manager, HTTPS, rate limits, audit events, DB migrations (disable TypeORM synchronize), webhook signing/replay protection, and durable retry/outbox handling.

## Windows PowerShell setup
1. Install Node.js 20+ and Docker Desktop.
2. Copy `.env.example` to `.env`.
3. Start MySQL:
   ```powershell
   docker compose up -d
   docker compose ps
   ```
4. Install and run backend:
   ```powershell
   npm install
   npm run start:dev
   ```
5. Verify:
   - http://localhost:8001/api/v1/health
   - http://localhost:8001/docs

Keep the existing People OS and HelpDesk backend processes running on ports 3001 and 3002. Ensure their webhook secrets match `.env`.

## APIs
- `GET /api/v1/health`
- `GET /api/v1/applications`
- `GET /api/v1/auth/me` (requires `x-mock-user: admin@npst.com` while mock auth enabled)
- `POST /api/v1/branding/drafts`
- `GET /api/v1/branding/versions?tenantId=NPST&applicationCode=PEOPLE_OS`
- `POST /api/v1/branding/publish`

### Publish request example
```json
{
  "tenantId": "NPST",
  "themeId": "NPST_PURPLE",
  "applicationCodes": ["PEOPLE_OS", "HELPDESK"],
  "publishedBy": "admin@npst.com",
  "style": {
    "primary": "#7138A5",
    "secondary": "#75677E",
    "accent": "#16845B",
    "bg": "#F8F5FC",
    "sidebarBg": "#7138A5",
    "cardBg": "#FFFFFF",
    "text": "#30213E",
    "borderColor": "#E8DFF0",
    "fontFamily": "Inter, Arial, sans-serif",
    "headingSize": 24,
    "bodySize": 14,
    "radius": 10,
    "componentStyle": "rounded",
    "shadow": "elevated"
  },
  "assets": {"logo": "", "favicon": ""}
}
```

The backend maps the frontend's style shape to the receiver contract (`colors`, `typography`, `components`, `branding`) and calls each selected application's webhook. Versions are incremented independently per tenant/application. Partial success is reported per application.

## Frontend connection
Your uploaded frontend currently uses localStorage-backed mock services in `src/services/brandingService.ts`; `src/lib/api.ts` uses relative `/api` calls and `vite.config.ts` currently proxies `/api` to `http://localhost:8001`. That proxy target already matches this backend. The frontend dev server runs on port 3000.

For initial API smoke testing in PowerShell:
```powershell
$body = @{
  tenantId = 'NPST'
  themeId = 'NPST_PURPLE'
  applicationCodes = @('PEOPLE_OS','HELPDESK')
  publishedBy = 'admin@npst.com'
  style = @{
    primary='#7138A5'; secondary='#75677E'; accent='#16845B'; bg='#F8F5FC'
    sidebarBg='#7138A5'; cardBg='#FFFFFF'; text='#30213E'; borderColor='#E8DFF0'
    fontFamily='Inter, Arial, sans-serif'; headingSize=24; bodySize=14; radius=10
    componentStyle='rounded'; shadow='elevated'
  }
  assets = @{ logo=''; favicon='' }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Method Post -Uri 'http://localhost:8001/api/v1/branding/publish' -ContentType 'application/json' -Body $body
```

## Next frontend integration change
Replace the local-only `publish()` and `applyToAllApplications()` paths in `src/services/brandingService.ts` with async calls to `POST /api/v1/branding/publish`. Keep draft editing and UI state intact initially, then migrate draft/version/approval reads to APIs in separate steps. The current editor uses local `appId` values; map these to backend codes explicitly (e.g. `app-keka` -> `PEOPLE_OS`, HelpDesk's actual app id -> `HELPDESK`) rather than assuming IDs match. Inspect `src/data/seed.ts` to confirm exact IDs before coding that adapter.
