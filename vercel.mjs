// Vercel evaluates this file at build time, not in the browser.
const origin = process.env.BACKEND_URL;
if (!origin) throw new Error('Set BACKEND_URL to the deployed Django HTTPS origin in Vercel.');
const backend = new URL(origin);
if (backend.protocol !== 'https:' || backend.username || backend.password ||
    backend.pathname !== '/' || backend.search || backend.hash) {
  throw new Error('BACKEND_URL must be an HTTPS origin without credentials, a path or a query.');
}

export const config = {
  framework: 'vite',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  rewrites: [
    { source: '/api/:path*', destination: `${backend.origin}/api/:path*` },
    { source: '/static/rest_framework/:path*', destination: `${backend.origin}/static/rest_framework/:path*` },
    { source: '/admin', destination: '/index.html' },
    { source: '/admin/:path*', destination: '/index.html' },
  ],
};
