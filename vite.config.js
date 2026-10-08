import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const backend = process.env.VITE_API_PROXY || 'http://127.0.0.1:8000'
export default defineConfig({plugins:[react()],server:{proxy:{'/api': backend, '/static/rest_framework': backend}}})
