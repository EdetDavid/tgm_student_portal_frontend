# TGM Student Portal frontend

React and Vite frontend for the TGM Education student and staff portals.

## Local development

```sh
npm ci
npm run dev
```

## GitHub Actions and deployment

`.github/workflows/ci.yml` runs on pushes and pull requests targeting `main`. It installs from the lockfile, runs the unit tests, and creates a production build.

Vercel is connected to this GitHub repository and handles deployment from the `main` branch. Pull requests use Vercel preview deployments; changes merged to `main` deploy to production. No Vercel credentials are stored in this repository.
