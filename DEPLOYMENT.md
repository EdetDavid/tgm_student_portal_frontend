# Student Portal frontend deployment

Production: https://tgm-student-portal-frontend.vercel.app/.
Staff portal: https://tgm-student-portal-frontend.vercel.app/portal/. Django admin: https://tgm-student-portal-backend.vercel.app/django-admin/.
Backend: https://tgm-student-portal-backend.vercel.app/.
API root: https://tgm-student-portal-backend.vercel.app/api/.
Backend repository: https://github.com/EdetDavid/tgm_education_student_portal.

Use /api/ to browse Django; the bare backend root is not a landing page. Public [courses](https://tgm-student-portal-backend.vercel.app/api/courses/) and [events](https://tgm-student-portal-backend.vercel.app/api/events/) are available without staff login. [ARCHITECTURE.md](ARCHITECTURE.md) includes all four diagrams and explains the server-side access checks.

Use Vite, npm run build and dist as output. Root Directory is empty for this standalone frontend repository. vercel.json points to the deployed backend at https://tgm-student-portal-backend.vercel.app and creates these routes (no frontend API environment variable is required):

- /api/* → Django /api/*.
- /static/rest_framework/* → Django's DRF static assets.
- /portal and /portal/* → React index.html.

Frontend API requests stay relative and use same-origin credentials. Django must have the frontend HTTPS origin in DJANGO_CSRF_TRUSTED_ORIGINS and the explicitly approved hostnames in DJANGO_ALLOWED_HOSTS. Do not change session cookies to insecure/cross-site to work around missing proxy routes. API responses must not be CDN cached. Never add the database URL or Django secret to VITE_* variables.

Local development uses Vite's proxy to http://127.0.0.1:8000, configurable with VITE_API_PROXY. If changing the backend host, update the two external destinations in vercel.json and redeploy. Keep Preview rewrites pointed at a separate synthetic-data backend.

After deployment, verify /api/courses/ returns JSON, /admin/ refresh works, student search/submission work, staff login and reports load, and anonymous staff API requests are denied. Keep Preview environments pointed at a separate synthetic-data backend.
