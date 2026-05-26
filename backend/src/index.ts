import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth';
import reportsRouter from './routes/reports';
import paymentsRouter from './routes/payments';

const app = express();
const PORT = process.env.PORT || 3001;

// Raw body for Stripe webhooks
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

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
app.use('/api/reports', reportsRouter);
app.use('/api/payments/confirm', analysisLimiter);
app.use('/api/payments', paymentsRouter);
console.log('Routes registered: /api/auth, /api/reports, /api/payments');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`SiteAnalyzer Pro API running on port ${PORT}`);
});

export default app;
