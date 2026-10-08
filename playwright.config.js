import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:5174',
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
      timeout: 60000,
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
      url: 'http://127.0.0.1:5174',
      env: { VITE_API_PROXY: 'http://127.0.0.1:8001' },
      timeout: 30000,
      reuseExistingServer: false,
    },
  ],
});
