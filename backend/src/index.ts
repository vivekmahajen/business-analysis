import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import authRouter from './routes/auth';
import reportsRouter from './routes/reports';
import paymentsRouter from './routes/payments';
import adminRouter from './routes/admin';
import billingRouter from './routes/billing';
import llmVisibilityRouter from './routes/llm-visibility';
import v1Router from './routes/v1';
import developerRouter from './routes/developer';
import termsRouter from './routes/terms';
import docsRouter from './routes/docs';
import { startWebhookWorker } from './services/webhookDelivery';
import { requireFullSession } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;

// Raw body for Stripe webhooks
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.options('*', cors({ origin: true, credentials: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Rate limiting for analysis endpoint (via payment confirm)
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,
  message: { error: 'Too many analysis requests. Please try again later.' },
  keyGenerator: (req) => {
    const authReq = req as express.Request & { userId?: string };
    return authReq.userId || req.ip || 'unknown';
  },
});

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path} [origin: ${req.headers.origin || 'none'}]`);
  next();
});

app.use('/api/auth', authRouter);
// All routes below require a full session token (not pending_2fa / pending_profile).
// Webhook paths and specified public paths are exempt from the session gate.
function sessionGate(...publicPaths: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (publicPaths.some(p => req.path === p)) return next();
    requireFullSession(req as never, res, next);
  };
}

app.use('/api/reports', requireFullSession, reportsRouter);
app.use('/api/payments/confirm', analysisLimiter);
app.use('/api/payments', sessionGate('/webhook'), paymentsRouter);
app.use('/api/admin', requireFullSession, adminRouter);
app.use('/api/billing', sessionGate('/webhook', '/plans'), billingRouter);
app.use('/api/llm', requireFullSession, llmVisibilityRouter);
app.use('/api/v1', v1Router);
app.use('/api/developer', developerRouter);
app.use('/terms', termsRouter);
app.use('/docs', docsRouter);
console.log('Routes registered: /api/auth, /api/reports, /api/payments, /api/admin, /api/billing, /api/llm, /api/v1, /api/developer, /docs');

// Serve OpenAPI spec
const openapiPath = path.join(__dirname, '..', '..', '..', 'openapi.yaml');
app.get('/api/openapi.yaml', (_req, res) => {
  if (fs.existsSync(openapiPath)) {
    res.setHeader('Content-Type', 'text/yaml');
    res.sendFile(openapiPath);
  } else {
    res.status(404).json({ error: 'OpenAPI spec not found' });
  }
});

startWebhookWorker();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/ping', (_req, res) => {
  res.json({ pong: true, timestamp: new Date().toISOString() });
});

// Serve frontend static files
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Global error handler — must be last, after all routes
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if ('status' in err && (err as any).status === 400 && 'body' in err) {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON.' } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' } });
});

app.listen(PORT, () => {
  console.log(`SiteAnalyzer Pro API running on port ${PORT}`);
});

export default app;
