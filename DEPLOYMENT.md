# Student Portal frontend deployment

Production: https://tgm-student-portal-frontend.vercel.app/.
Backend repository: https://github.com/EdetDavid/tgm_education_student_portal.

Use Vite, npm run build and dist as output. Root Directory is empty for this standalone frontend repository. Set **BACKEND_URL** in Vercel's Production environment to the actual deployed Django HTTPS origin (without /api), then redeploy. vercel.mjs refuses a missing/invalid origin and creates these routes:

- /api/* → Django /api/*.
- /static/rest_framework/* → Django's DRF static assets.
- /admin and /admin/* → React index.html.

Frontend API requests stay relative and use same-origin credentials. Django must have the frontend HTTPS origin in DJANGO_CSRF_TRUSTED_ORIGINS and the explicitly approved hostnames in DJANGO_ALLOWED_HOSTS. Do not change session cookies to insecure/cross-site to work around missing proxy routes. API responses must not be CDN cached. Never add the database URL or Django secret to VITE_* variables.

Local development does not need BACKEND_URL: Vite proxies to http://127.0.0.1:8000, configurable with VITE_API_PROXY.

After deployment, verify /api/courses/ returns JSON, /admin/ refresh works, student search/submission work, staff login and reports load, and anonymous staff API requests are denied. Keep Preview environments pointed at a separate synthetic-data backend.
