# KaemForm — API Contract

## Cross-Project APIs (Kaemnur ↔ KaemForm)

### 1. Generate Launch Token

**Caller:** Kaemnur frontend → Kaemnur Edge Function
**Location:** Supabase Project A

```
POST {KAEMNUR_SUPABASE}/functions/v1/generate-launch-token
Headers: Authorization: Bearer {supabase_session_jwt}

Response 200:
{"token": "eyJ...", "redirect_url": "https://form.kaemnur.com/auth/callback"}

Response 401: {"error": "Not authenticated"}
```

Token payload (JWT, HMAC-SHA256, LAUNCH_TOKEN_SECRET, 60s expiry):
```json
{
  "kaemnur_uid": "uuid", "email": "x@gmail.com", "name": "Name", "avatar_url": "url|null",
  "license": {
    "type": "free|trial|pro",
    "expires_at": "ISO8601|null",
    "limits": {
      "workspaces": "number|null",
      "forms": "number|null",
      "responses_per_month": "number|null",
      "retention_days": "number",
      "export_pdf": "boolean",
      "custom_branding": "boolean"
    },
    "storage_addon": {"retention_days": 0, "expires_at": "ISO8601|null"}
  },
  "iat": 1750000000, "exp": 1750000060
}
```

License type logic on Kaemnur:
- pro: latest active KaemForm license is linked to a paid order, or `isActivated=true`
- trial: latest active KaemForm license exists but is not paid/activated
- free: otherwise

### 2. Check License

**Caller:** KaemForm server → Kaemnur Edge Function
**Location:** Supabase Project A

```
GET {KAEMNUR_SUPABASE}/functions/v1/check-license?email=x@gmail.com
 atau
GET {KAEMNUR_SUPABASE}/functions/v1/check-license?kaemnur_uid=uuid
Headers: x-api-key: {KAEMFORM_API_KEY}

Response 200 (found):
{
  "found": true, "kaemnur_uid": "uuid", "email": "x@gmail.com",
  "name": "Name", "avatar_url": "url",
  "license": {same structure as launch token}
}

Response 200 (not found): {"found": false}
Response 401: {"error": "Invalid API key"}
```

## Internal API Routes (KaemForm)

Semua route authenticated kecuali yang ditandai. Auth via Supabase session JWT.

### Workspaces

```
GET    /api/workspaces                    → list user's workspaces (+ form count, response count)
POST   /api/workspaces                    → create workspace {name} → auto-generate slug, cek limit tier
GET    /api/workspaces/[id]               → detail
PATCH  /api/workspaces/[id]               → update {name, settings}
DELETE /api/workspaces/[id]               → soft delete
```

### Forms

```
POST   /api/forms                         → create {workspace_id, title, template_id?} → generate slug, cek limit
GET    /api/forms/[id]                    → detail + schema + settings
PATCH  /api/forms/[id]                    → update {title, description, schema, settings, status}
DELETE /api/forms/[id]                    → soft delete
POST   /api/forms/[id]/publish            → set published + published_at (validasi: min 1 field)
POST   /api/forms/[id]/close              → set closed + closed_at
POST   /api/forms/[id]/duplicate          → copy form, new slug, status=draft, count=0
```

### Responses

```
POST   /api/responses                     → submit response {form_id, data} [NO AUTH — publik]
                                            validasi: form published, limit, honeypot, rate limit
                                            set expires_at = submitted_at + owner's retention_days
GET    /api/forms/[id]/responses          → list responses {page, limit, sort, search}
GET    /api/forms/[id]/responses/[rid]    → detail response
DELETE /api/forms/[id]/responses/[rid]    → soft delete
GET    /api/forms/[id]/stats              → {total, today, thisWeek, perDay[]}
```

### Export

```
GET    /api/forms/[id]/export/csv         → download CSV (rate limit: 10/jam)
GET    /api/forms/[id]/export/pdf         → download PDF table (Pro only, rate limit: 10/jam)
```

### Templates

```
GET    /api/templates                     → list {filter: system|mine}
POST   /api/templates                     → save form as template {title, description, schema, settings}
DELETE /api/templates/[id]                → delete personal template
```

### Auth

```
GET    /auth/callback?token=xxx           → validate launch token, create/update user, set session
GET    /auth/google                       → initiate Google OAuth
GET    /auth/google/callback              → handle OAuth callback
POST   /auth/logout                       → sign out
POST   /api/license/refresh               → force sync license from Kaemnur
```

### Cron

```
POST   /api/cron/retention                → retention cleanup (protected by CRON_SECRET header)
```

## Rate Limits

| Endpoint | Limit |
|---|---|
| Response submit | 5/menit/IP |
| API authenticated | 100/menit/user |
| Form view public | 60/menit/IP |
| Export | 10/jam/user |
| Auth callback | 10/menit/IP |

## Env Variables

```
# Supabase KaemForm (Project B)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth Bridge
LAUNCH_TOKEN_SECRET=         # shared with Kaemnur

# Kaemnur API (Project A)
KAEMNUR_API_URL=
KAEMNUR_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://form.kaemnur.com
NEXT_PUBLIC_KAEMNUR_URL=https://kaemnur.com

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@kaemnur.com

# Cron
CRON_SECRET=
```
