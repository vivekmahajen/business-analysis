# SiteAnalyzer Pro

AI-powered competitive intelligence reports for any business website. $99 per report, powered by Claude AI with real-time web search.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`) with web search tool
- **Payments:** Stripe
- **Fonts:** Syne + DM Sans (Google Fonts)

## Project Structure

```
business-analysis/
├── frontend/          # React + Vite app
│   └── src/
│       ├── components/    # Screen components
│       ├── types/         # TypeScript interfaces
│       └── utils/         # API client + HTML export
├── backend/           # Express API
│   └── src/
│       ├── routes/        # auth, reports, payments
│       ├── middleware/     # JWT auth
│       ├── services/      # Claude API analysis
│       └── lib/           # Prisma client
└── prisma/
    └── schema.prisma      # DB schema
```

## Setup

### 1. Database

```bash
# Create a PostgreSQL database, then:
cp backend/.env.example backend/.env
# Fill in DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, STRIPE keys
npx prisma db push --schema=prisma/schema.prisma
```

### 2. Backend

```bash
cd backend
npm install
npm run dev    # Runs on :3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev    # Runs on :5173, proxies /api to :3001
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random secret for JWT signing |
| `REPORT_PRICE_CENTS` | Report price in cents (default: `9900`) |
| `PORT` | Backend port (default: `3001`) |
| `FRONTEND_URL` | Frontend origin for CORS (default: `http://localhost:5173`) |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/reports` | List user's reports |
| `GET` | `/api/reports/check?url=` | Check if report exists for URL |
| `GET` | `/api/reports/:id` | Get single report |
| `DELETE` | `/api/reports/:id` | Delete a report |
| `POST` | `/api/payments/intent` | Create Stripe PaymentIntent |
| `POST` | `/api/payments/confirm` | Confirm payment + generate report |
| `POST` | `/api/payments/webhook` | Stripe webhook handler |

## Stripe Integration

In production, replace the mock payment form in `PaymentScreen.tsx` with Stripe Elements:

```typescript
import { loadStripe } from '@stripe/stripe-js';
const stripe = await loadStripe(publishableKey);
const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement, billing_details: { name } },
});
```

## Screen Flow

```
Landing → Auth → Dashboard → [check URL]
                                ├── Found → View Free OR Pay $99
                                └── Not Found → Pay $99
                                        ↓
                               Generating (animated steps)
                                        ↓
                               Report (download HTML)
```
