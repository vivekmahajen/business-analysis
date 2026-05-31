import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>API Terms of Service — SiteAnalyzer Pro</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #cbd5e1;
      line-height: 1.7;
      padding: 2rem 1rem 4rem;
    }
    .wrap { max-width: 760px; margin: 0 auto; }
    .logo {
      display: inline-flex; align-items: center; gap: 0.5rem;
      color: #60a5fa; text-decoration: none; font-weight: 700; font-size: 1.1rem;
      margin-bottom: 2.5rem; display: block;
    }
    h1 { font-size: 2rem; font-weight: 800; color: #f1f5f9; margin-bottom: 0.5rem; }
    .meta { color: #64748b; font-size: 0.875rem; margin-bottom: 3rem; }
    h2 { font-size: 1.125rem; font-weight: 700; color: #e2e8f0; margin: 2.5rem 0 0.75rem; }
    p { margin-bottom: 1rem; }
    ul { padding-left: 1.5rem; margin-bottom: 1rem; }
    li { margin-bottom: 0.4rem; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .divider { border: none; border-top: 1px solid #1e293b; margin: 2rem 0; }
    .badge {
      display: inline-block; background: #1e3a5f; color: #60a5fa;
      font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem;
      border-radius: 999px; margin-bottom: 1rem;
    }
    footer { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #1e293b;
             color: #475569; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <a class="logo" href="/">&#9650; SiteAnalyzer Pro</a>

    <span class="badge">Legal</span>
    <h1>API Terms of Service</h1>
    <p class="meta">Effective date: June 1, 2026 &nbsp;·&nbsp; Last updated: June 1, 2026</p>

    <p>
      These API Terms of Service ("Terms") govern your access to and use of the
      SiteAnalyzer Pro API ("API"). By obtaining an API key or making any request
      to the API, you agree to be bound by these Terms. If you do not agree, do
      not use the API.
    </p>

    <hr class="divider" />

    <h2>1. Who We Are</h2>
    <p>
      SiteAnalyzer Pro ("we", "us", "our") operates the AI-powered competitive
      intelligence platform available at
      <a href="https://siteanalyzerpro.com">siteanalyzerpro.com</a>.
      Questions about these Terms can be directed to
      <a href="mailto:api@siteanalyzerpro.com">api@siteanalyzerpro.com</a>.
    </p>

    <h2>2. API Access and Keys</h2>
    <p>
      To use the API, you must create an account and obtain an API key. You are
      responsible for keeping your API key confidential. You must not share your
      key, embed it in publicly accessible client-side code, or transfer it to
      third parties. We may revoke any key at any time if we reasonably believe it
      has been compromised or is being misused.
    </p>

    <h2>3. Permitted Use</h2>
    <p>You may use the API to:</p>
    <ul>
      <li>Build applications, tools, and integrations for your own business or for your clients</li>
      <li>Automate competitive intelligence workflows</li>
      <li>Display or store analysis results within your own product</li>
    </ul>
    <p>You may not:</p>
    <ul>
      <li>Resell, sublicense, or redistribute raw API responses as a competing data product</li>
      <li>Reverse-engineer, scrape, or cache results to circumvent API quotas</li>
      <li>Use the API to generate reports on competitor products of SiteAnalyzer Pro itself</li>
      <li>Submit malicious, unlawful, or deceptive URLs</li>
      <li>Attempt to circumvent rate limits or authentication</li>
    </ul>

    <h2>4. Rate Limits and Quotas</h2>
    <p>
      Each plan includes a monthly call quota and per-minute rate limit as
      described on our <a href="/pricing">pricing page</a>. Exceeding your quota
      will result in a <code>402 QUOTA_EXCEEDED</code> error until the quota
      resets at the start of the next calendar month. We reserve the right to
      throttle or suspend access for patterns that degrade service quality for
      other users.
    </p>

    <h2>5. Service Levels</h2>
    <ul>
      <li><strong>Free plan:</strong> No uptime guarantee. Best-effort availability.</li>
      <li><strong>Starter plan:</strong> Best-effort availability. No formal SLA.</li>
      <li><strong>Professional plan:</strong> 99.5% monthly uptime target.</li>
      <li><strong>Enterprise plan:</strong> 99.9% monthly uptime with credit remedies as agreed.</li>
    </ul>
    <p>
      Scheduled maintenance, force majeure events, and third-party AI provider
      outages (OpenAI, Anthropic, Perplexity) are excluded from uptime calculations.
    </p>

    <h2>6. Data and Privacy</h2>
    <p>
      We log API requests for billing, debugging, and abuse prevention. Request
      metadata (URL submitted, timestamp, response status) is retained for 90 days
      on Starter and Professional plans, and 365 days on Enterprise. Full analysis
      reports are stored for 30 days on free plans and 90 days on paid plans.
      We do not sell your data to third parties. See our
      <a href="/privacy">Privacy Policy</a> for full details.
    </p>

    <h2>7. Intellectual Property</h2>
    <p>
      Analysis results generated by the API are provided for your use under your
      plan. We retain no ownership claim over the raw output delivered to you.
      However, the underlying models, algorithms, query logic, and API infrastructure
      remain the exclusive property of SiteAnalyzer Pro.
    </p>

    <h2>8. Third-Party AI Services</h2>
    <p>
      Our API is powered in part by third-party AI providers including Anthropic
      (Claude) and OpenAI. Results are AI-generated and may contain inaccuracies.
      We do not warrant the factual accuracy of any analysis output. You are
      responsible for validating results before making business decisions.
    </p>

    <h2>9. Disclaimers</h2>
    <p>
      THE API IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
      KIND, EXPRESS OR IMPLIED, INCLUDING FITNESS FOR A PARTICULAR PURPOSE,
      MERCHANTABILITY, OR NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE API
      WILL BE ERROR-FREE, UNINTERRUPTED, OR THAT RESULTS WILL BE ACCURATE OR COMPLETE.
    </p>

    <h2>10. Limitation of Liability</h2>
    <p>
      TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIMS
      ARISING FROM YOUR USE OF THE API SHALL NOT EXCEED THE GREATER OF (A) THE
      AMOUNT YOU PAID US IN THE THREE MONTHS PRIOR TO THE CLAIM, OR (B) $50 USD.
      WE WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL
      DAMAGES.
    </p>

    <h2>11. Changes to These Terms</h2>
    <p>
      We may update these Terms from time to time. We will notify registered users
      by email at least 14 days before material changes take effect. Continued use
      of the API after the effective date constitutes acceptance of the updated Terms.
    </p>

    <h2>12. Termination</h2>
    <p>
      Either party may terminate your API access at any time. We may suspend or
      terminate access immediately for violations of these Terms. Upon termination,
      your API keys will be revoked and stored report data will be deleted after
      30 days.
    </p>

    <h2>13. Governing Law</h2>
    <p>
      These Terms are governed by the laws of the State of California, United States,
      without regard to conflict-of-law principles. Any disputes shall be resolved
      in the state or federal courts located in San Francisco County, California.
    </p>

    <hr class="divider" />

    <p>
      Questions? Email us at
      <a href="mailto:api@siteanalyzerpro.com">api@siteanalyzerpro.com</a>.
    </p>

    <footer>
      &copy; 2026 SiteAnalyzer Pro &nbsp;·&nbsp;
      <a href="/">Home</a> &nbsp;·&nbsp;
      <a href="/privacy">Privacy Policy</a>
    </footer>
  </div>
</body>
</html>`);
});

export default router;
