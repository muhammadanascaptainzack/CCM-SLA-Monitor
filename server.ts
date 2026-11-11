import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/api.js';
import { storage } from './src/server/storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Disable X-Powered-By header to prevent server fingerprinting (OWASP)
app.disable('x-powered-by');

// Apply OWASP Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Body parsers (10mb limit to support admin logo image & 5MB complaint screenshot uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', apiRouter);

async function startServer() {
  if (!isProd) {
    // In development mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: 3000,
        host: '0.0.0.0',
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // In production mode, serve built static files from dist with caching headers
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { maxAge: '1h' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Listen on port 4000 (user requested), port 3000 (preview), and process.env.PORT if specified
  const portsToListen = new Set<number>([4000, 3000]);
  if (process.env.PORT) {
    const envPort = parseInt(process.env.PORT, 10);
    if (!isNaN(envPort)) {
      portsToListen.add(envPort);
    }
  }

  for (const port of portsToListen) {
    try {
      const s = app.listen(port, '0.0.0.0', () => {
        console.log(`[Citrus CMS] Server listening on port ${port} at http://0.0.0.0:${port}`);
      });
      s.keepAliveTimeout = 65_000;
      s.headersTimeout = 66_000;
      s.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[Citrus CMS] Port ${port} already in use on host, continuing.`);
        } else {
          console.error(`[Citrus CMS] Port ${port} error:`, err.message);
        }
      });
    } catch (e: any) {
      console.warn(`[Citrus CMS] Failed to bind port ${port}:`, e.message);
    }
  }
}

// Graceful shutdown hook to ensure pending write-behind database changes are flushed atomically
function gracefulShutdown(signal: string) {
  console.log(`[Citrus CMS] Received ${signal}, flushing database to disk...`);
  storage.saveDatabaseSync();
  process.exit(0);
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer().catch(err => {
  console.error('[Citrus CMS Server] Failed to start:', err);
  process.exit(1);
});
