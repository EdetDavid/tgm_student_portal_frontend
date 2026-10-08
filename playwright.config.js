import { defineConfig } from '@playwright/test';

const frontendPort = Number(process.env.PLAYWRIGHT_PORT || 5174);
if (!Number.isInteger(frontendPort) || frontendPort < 1024 || frontendPort > 65535) throw new Error('Invalid PLAYWRIGHT_PORT');
const frontendURL = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: './tests',
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  use: {
    baseURL: frontendURL,
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: process.platform === 'win32'
        ? '..\\backend\\.venv\\Scripts\\python.exe ..\\backend\\scripts\\e2e_server.py'
        : '../backend/.venv/bin/python ../backend/scripts/e2e_server.py',
      url: 'http://127.0.0.1:8001/api/courses/',
      env: { E2E_FRONTEND_ORIGIN: frontendURL },
      timeout: 60000,
      reuseExistingServer: false,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${frontendPort} --strictPort`,
      url: frontendURL,
      env: { VITE_API_PROXY: 'http://127.0.0.1:8001' },
      timeout: 30000,
      reuseExistingServer: false,
    },
  ],
});
