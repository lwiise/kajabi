# Kajabi Coupon System

Auto-send unique coupon codes when someone buys on Kajabi.

**Flow:** Kajabi purchase → Netlify Function → Supabase (pick unused code) → Resend (email user)

---

## ⚠️ IMPORTANT — Folder structure on GitHub

When you upload this to GitHub, all these files and folders must be at the **ROOT** of the repository — NOT inside an extra `kajabi-coupon-system/` folder.

✅ Correct repo structure:
```
your-repo/
├── lib/
├── netlify/
├── sql/
├── netlify.toml
├── package.json
└── ...
```

❌ Wrong (Netlify will not find the function):
```
your-repo/
└── kajabi-coupon-system/
    ├── lib/
    ├── netlify/
    └── ...
```

If your repo already has the nested folder, fix it via Netlify: **Site configuration → Build & deploy → Build settings → Base directory** = `kajabi-coupon-system`

---

## Setup

### 1. Supabase
1. https://supabase.com → create a project
2. **SQL Editor** → paste `sql/setup.sql` → Run
3. Insert your real coupon codes (bulk insert via SQL)
4. **Settings → API**: copy `Project URL` and `service_role` key

### 2. Resend
1. https://resend.com → sign up
2. **API Keys** → Create → copy the `re_...` key
3. Free tier note: until you verify a domain, you can only send to your own signup email

### 3. Netlify
1. Push this repo to GitHub
2. https://app.netlify.com → Add new site → Import from Git → pick the repo
3. **Site settings → Environment variables** → add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
4. **Deploys → Trigger deploy → Deploy site** (env vars need a fresh deploy to load)

### 4. Test (PowerShell)
```powershell
Invoke-RestMethod -Uri "https://YOUR-SITE.netlify.app/.netlify/functions/kajabi-webhook" -Method POST -ContentType "application/json" -Body '{"email":"your-resend-signup-email@gmail.com","name":"Test"}'
```

Expected:
```
success code
------- ----
   True S6CSWN
```

### 5. Kajabi
- **Settings → Webhooks → Add Webhook**
- URL: `https://YOUR-SITE.netlify.app/.netlify/functions/kajabi-webhook`
- Trigger: Purchase completed

---

## Useful SQL queries

Count remaining unused coupons:
```sql
select count(*) from coupons where used = false;
```

See who got which code:
```sql
select code, assigned_to, assigned_at
from coupons
where used = true
order by assigned_at desc;
```

Add more codes later:
```sql
insert into coupons (code) values ('NEW001'), ('NEW002');
```

---

## Troubleshooting

| Problem | Cause |
|---|---|
| 404 Page not found | Function did not deploy. Check `netlify.toml` is at repo root, or set Base directory in Netlify |
| "No coupons available" | Table empty, OR `get_coupon` function signature mismatch. Re-run `sql/setup.sql` |
| "Missing email in payload" | Webhook body did not include an `email` field |
| Email never arrives | Resend free tier only sends to your verified signup email. Verify a domain for production |
| 500 Database error | `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` wrong, or `get_coupon` function not created |

---

## File structure

```
kajabi-coupon-system/
├── lib/
│   ├── resend.js
│   └── supabase.js
├── netlify/
│   └── functions/
│       └── kajabi-webhook.js
├── sql/
│   └── setup.sql
├── .env.example
├── .gitignore
├── netlify.toml
├── package.json
└── README.md
```
