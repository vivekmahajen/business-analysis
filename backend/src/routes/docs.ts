import { Router } from 'express';

const router = Router();

const BASE_URL = 'https://siteanalyzer-backend-production-b23c.up.railway.app/api/v1';

router.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Developer Docs — SiteAnalyzer Pro API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f172a;
      --surface: #1e293b;
      --surface2: #162032;
      --border: #1e3a5f;
      --text: #e2e8f0;
      --muted: #64748b;
      --accent: #3b82f6;
      --accent-dim: #1d4ed8;
      --green: #22c55e;
      --yellow: #f59e0b;
      --red: #ef4444;
      --purple: #a855f7;
      --sidebar-w: 260px;
    }

    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
      font-size: 15px;
    }

    /* ── SIDEBAR ── */
    .sidebar {
      position: fixed; top: 0; left: 0; bottom: 0;
      width: var(--sidebar-w);
      background: var(--surface2);
      border-right: 1px solid var(--border);
      overflow-y: auto;
      padding: 0 0 2rem;
      z-index: 100;
    }
    .sidebar-logo {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 1.25rem 1.25rem 1rem;
      border-bottom: 1px solid var(--border);
      text-decoration: none;
    }
    .sidebar-logo-text { font-size: 0.95rem; font-weight: 700; color: var(--text); }
    .sidebar-logo-text span { color: var(--accent); }
    .sidebar-badge {
      font-size: 0.65rem; font-weight: 600; background: var(--accent-dim);
      color: #93c5fd; padding: 0.15rem 0.4rem; border-radius: 4px; margin-left: auto;
    }
    .nav-section { padding: 1rem 1.25rem 0.25rem; font-size: 0.7rem; font-weight: 600;
                   text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
    .nav-link {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.45rem 1.25rem; font-size: 0.875rem; color: #94a3b8;
      text-decoration: none; border-left: 2px solid transparent;
      transition: all 0.15s;
    }
    .nav-link:hover { color: var(--text); background: rgba(59,130,246,0.06); }
    .nav-link.active { color: var(--accent); border-left-color: var(--accent);
                       background: rgba(59,130,246,0.1); }
    .nav-link .method-badge {
      font-size: 0.6rem; font-weight: 700; padding: 0.1rem 0.35rem;
      border-radius: 3px; margin-left: auto; font-family: 'JetBrains Mono', monospace;
    }
    .get  { background: rgba(34,197,94,0.15);  color: #4ade80; }
    .post { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .del  { background: rgba(239,68,68,0.15);  color: #f87171; }

    /* ── MAIN ── */
    .main {
      margin-left: var(--sidebar-w);
      padding: 3rem 2.5rem 6rem;
      max-width: 900px;
    }

    /* ── SECTIONS ── */
    section { padding-top: 2.5rem; }
    section + section { border-top: 1px solid var(--border); margin-top: 1rem; }

    h1 { font-size: 2rem; font-weight: 700; color: #f8fafc; margin-bottom: 0.5rem; }
    h2 { font-size: 1.35rem; font-weight: 700; color: #f1f5f9; margin-bottom: 1rem; }
    h3 { font-size: 1rem; font-weight: 600; color: #e2e8f0; margin: 1.5rem 0 0.6rem; }
    p { color: #94a3b8; margin-bottom: 0.85rem; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }

    .subtitle { font-size: 1.05rem; color: #64748b; margin-bottom: 2rem; }
    .hero-meta { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
    .hero-chip {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 6px; padding: 0.3rem 0.7rem; font-size: 0.8rem; color: #94a3b8;
    }
    .hero-chip b { color: var(--text); }

    /* ── CODE BLOCKS ── */
    .code-tabs { margin: 1rem 0; }
    .tab-bar { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--border); margin-bottom: 0; }
    .tab-btn {
      padding: 0.4rem 0.8rem; font-size: 0.8rem; font-weight: 500; cursor: pointer;
      background: none; border: none; color: var(--muted); border-bottom: 2px solid transparent;
      margin-bottom: -1px; transition: all 0.15s;
    }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
    .tab-btn:hover { color: var(--text); }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    pre {
      background: #0a1628; border: 1px solid var(--border); border-radius: 0 0 8px 8px;
      padding: 1.25rem 1.5rem; overflow-x: auto; font-size: 0.82rem; line-height: 1.7;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }
    .tab-bar + pre { border-radius: 0 8px 8px 8px; }
    code.inline {
      background: rgba(59,130,246,0.1); color: #93c5fd;
      border: 1px solid rgba(59,130,246,0.2); border-radius: 4px;
      padding: 0.1em 0.4em; font-family: 'JetBrains Mono', monospace; font-size: 0.85em;
    }

    .hl-comment { color: #475569; }
    .hl-key     { color: #7dd3fc; }
    .hl-str     { color: #86efac; }
    .hl-num     { color: #fbbf24; }
    .hl-kw      { color: #c084fc; }
    .hl-fn      { color: #60a5fa; }
    .hl-var     { color: #e2e8f0; }
    .hl-curl    { color: #f9a8d4; }
    .hl-flag    { color: #94a3b8; }
    .hl-url     { color: #86efac; }

    /* ── TABLES ── */
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin: 1rem 0; }
    th { text-align: left; padding: 0.6rem 1rem; background: var(--surface);
         color: #64748b; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
         letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #1a2e4a; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(59,130,246,0.03); }
    td code { font-family: 'JetBrains Mono', monospace; font-size: 0.82em;
              background: rgba(255,255,255,0.05); padding: 0.1em 0.3em; border-radius: 3px; }

    /* ── CALLOUTS ── */
    .callout {
      display: flex; gap: 0.75rem; padding: 1rem 1.25rem;
      border-radius: 8px; margin: 1rem 0; font-size: 0.875rem;
    }
    .callout-info { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.25); color: #93c5fd; }
    .callout-warn { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); color: #fcd34d; }
    .callout-icon { font-size: 1rem; flex-shrink: 0; margin-top: 0.1rem; }
    .callout-text { color: #94a3b8; }
    .callout-text b { color: var(--text); }

    /* ── ENDPOINT CARDS ── */
    .endpoint {
      border: 1px solid var(--border); border-radius: 10px;
      overflow: hidden; margin: 1.25rem 0;
    }
    .endpoint-header {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.85rem 1.25rem; background: var(--surface);
      cursor: pointer; user-select: none;
    }
    .endpoint-header:hover { background: #1e3a5f30; }
    .method {
      font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; font-weight: 700;
      padding: 0.2rem 0.5rem; border-radius: 4px; flex-shrink: 0;
    }
    .method-GET  { background: rgba(34,197,94,0.15);  color: #4ade80; }
    .method-POST { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .method-DELETE { background: rgba(239,68,68,0.15); color: #f87171; }
    .endpoint-path { font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; color: #e2e8f0; }
    .endpoint-desc { margin-left: auto; font-size: 0.8rem; color: var(--muted); }
    .endpoint-body { padding: 1.25rem; border-top: 1px solid var(--border); }
    .endpoint-body p { font-size: 0.875rem; }
    .endpoint-body pre { border-radius: 6px; }

    /* ── PLAN CARDS ── */
    .plan-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin: 1rem 0; }
    .plan-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 1.1rem;
    }
    .plan-card.featured { border-color: var(--accent); }
    .plan-name { font-weight: 700; font-size: 0.9rem; color: var(--text); margin-bottom: 0.25rem; }
    .plan-price { font-size: 1.4rem; font-weight: 700; color: var(--accent); margin-bottom: 0.75rem; }
    .plan-price span { font-size: 0.8rem; color: var(--muted); font-weight: 400; }
    .plan-feat { font-size: 0.78rem; color: #64748b; margin-bottom: 0.3rem; display: flex; gap: 0.4rem; }
    .plan-feat b { color: #94a3b8; }
    .check { color: var(--green); }
    .cross { color: var(--muted); }

    /* ── RESPONSE BADGE ── */
    .status { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
               font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 4px; }
    .s2xx { background: rgba(34,197,94,0.12); color: #4ade80; }
    .s4xx { background: rgba(239,68,68,0.12); color: #f87171; }
    .s5xx { background: rgba(245,158,11,0.12); color: #fbbf24; }

    @media (max-width: 900px) {
      .sidebar { transform: translateX(-100%); }
      .main { margin-left: 0; padding: 2rem 1.25rem 5rem; }
      .plan-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>

<!-- SIDEBAR -->
<nav class="sidebar">
  <a class="sidebar-logo" href="/">
    <span class="sidebar-logo-text">SiteAnalyzer <span>Pro</span></span>
    <span class="sidebar-badge">v1</span>
  </a>

  <div class="nav-section">Getting Started</div>
  <a class="nav-link active" href="#overview">Overview</a>
  <a class="nav-link" href="#authentication">Authentication</a>
  <a class="nav-link" href="#quickstart">Quick Start</a>
  <a class="nav-link" href="#plans">Plans &amp; Limits</a>

  <div class="nav-section">API Reference</div>
  <a class="nav-link" href="#analyze">
    <span>POST /analyze</span>
    <span class="method-badge post">POST</span>
  </a>
  <a class="nav-link" href="#jobs">
    <span>GET /jobs/{id}</span>
    <span class="method-badge get">GET</span>
  </a>
  <a class="nav-link" href="#reports">
    <span>Reports</span>
  </a>
  <a class="nav-link" href="#usage">
    <span>GET /usage</span>
    <span class="method-badge get">GET</span>
  </a>
  <a class="nav-link" href="#webhooks">
    <span>Webhooks</span>
  </a>

  <div class="nav-section">Reference</div>
  <a class="nav-link" href="#response-format">Response Format</a>
  <a class="nav-link" href="#errors">Error Codes</a>
  <a class="nav-link" href="#headers">Response Headers</a>

  <div class="nav-section">Resources</div>
  <a class="nav-link" href="/api/openapi.yaml" target="_blank">OpenAPI 3.1 Spec</a>
  <a class="nav-link" href="/terms">Terms of Service</a>
</nav>

<!-- MAIN CONTENT -->
<main class="main">

  <!-- ── OVERVIEW ── -->
  <section id="overview">
    <h1>SiteAnalyzer Pro API</h1>
    <p class="subtitle">AI-powered competitive intelligence for any business URL — one call returns a full scored gap analysis, competitor benchmarks, and a prioritized 90-day action plan.</p>

    <div class="hero-meta">
      <div class="hero-chip">Base URL: <b>${BASE_URL}</b></div>
      <div class="hero-chip">Auth: <b>X-API-Key header</b></div>
      <div class="hero-chip">Format: <b>JSON</b></div>
      <div class="hero-chip">Version: <b>v1</b></div>
    </div>

    <div class="callout callout-info">
      <span class="callout-icon">ℹ️</span>
      <div class="callout-text">
        Analysis runs asynchronously (60–120 seconds). Submit a job, get a <code class="inline">jobId</code> back, then poll <code class="inline">GET /jobs/{jobId}</code> until <code class="inline">status = "completed"</code>. Or pass <code class="inline">responseMode: "sync"</code> to wait for the full result in one call (testing only).
      </div>
    </div>

    <h3>What you get back</h3>
    <table>
      <thead><tr><th>Field</th><th>Description</th></tr></thead>
      <tbody>
        <tr><td><code>overallScore</code></td><td>0–100 composite score (SEO, digital presence, content, UX)</td></tr>
        <tr><td><code>competitors</code></td><td>4–5 real local competitors with individual scores and profiles</td></tr>
        <tr><td><code>gaps</code></td><td>Prioritized competitive gaps with estimated revenue impact</td></tr>
        <tr><td><code>recommendations</code></td><td>90-day action plan with effort/impact ratings and step-by-step instructions</td></tr>
        <tr><td><code>marketPosition</code></td><td>Leader / Challenger / Follower / Nicher</td></tr>
        <tr><td><code>aisps</code></td><td>AI Search Presence Score — how often you appear in ChatGPT &amp; Perplexity (Professional+)</td></tr>
      </tbody>
    </table>
  </section>

  <!-- ── AUTHENTICATION ── -->
  <section id="authentication">
    <h2>Authentication</h2>
    <p>Every request must include your API key in the <code class="inline">X-API-Key</code> header. Keys start with <code class="inline">sk_live_</code>.</p>

    <pre><span class="hl-curl">curl</span> ${BASE_URL}/usage \\
  <span class="hl-flag">-H</span> <span class="hl-str">"X-API-Key: sk_live_YOUR_KEY"</span></pre>

    <div class="callout callout-warn">
      <span class="callout-icon">⚠️</span>
      <div class="callout-text">
        <b>Keep your key secret.</b> Never embed it in client-side JavaScript or public repositories. If compromised, revoke it from your dashboard and issue a new one.
      </div>
    </div>

    <h3>Getting a key</h3>
    <p>Sign in to your account and go to <a href="/developers">siteanalyzerpro.com/developers</a> to create and manage API keys. Free tier gives you 100 calls/month with no credit card required.</p>
  </section>

  <!-- ── QUICK START ── -->
  <section id="quickstart">
    <h2>Quick Start</h2>
    <p>Analyze a business and retrieve the full report in three steps.</p>

    <h3>Step 1 — Submit the URL</h3>
    <div class="code-tabs">
      <div class="tab-bar">
        <button class="tab-btn active" onclick="switchTab(this,'qs','curl')">cURL</button>
        <button class="tab-btn" onclick="switchTab(this,'qs','python')">Python</button>
        <button class="tab-btn" onclick="switchTab(this,'qs','node')">Node.js</button>
      </div>
      <div id="qs-curl" class="tab-panel active">
        <pre><span class="hl-curl">curl</span> <span class="hl-flag">-X POST</span> ${BASE_URL}/analyze \\
  <span class="hl-flag">-H</span> <span class="hl-str">"X-API-Key: sk_live_YOUR_KEY"</span> \\
  <span class="hl-flag">-H</span> <span class="hl-str">"Content-Type: application/json"</span> \\
  <span class="hl-flag">-d</span> <span class="hl-str">'{
    "url": "https://mamamiapizza.com",
    "radius": 10,
    "responseMode": "async"
  }'</span></pre>
      </div>
      <div id="qs-python" class="tab-panel">
        <pre><span class="hl-kw">import</span> <span class="hl-var">requests</span>

<span class="hl-var">API_KEY</span> <span class="hl-var">=</span> <span class="hl-str">"sk_live_YOUR_KEY"</span>
<span class="hl-var">BASE</span>    <span class="hl-var">=</span> <span class="hl-str">"${BASE_URL}"</span>

<span class="hl-var">resp</span> <span class="hl-var">=</span> <span class="hl-var">requests</span>.<span class="hl-fn">post</span>(
    <span class="hl-str">f"{BASE}/analyze"</span>,
    <span class="hl-var">headers</span><span class="hl-var">=</span>{<span class="hl-str">"X-API-Key"</span>: <span class="hl-var">API_KEY</span>},
    <span class="hl-var">json</span><span class="hl-var">=</span>{
        <span class="hl-str">"url"</span>: <span class="hl-str">"https://mamamiapizza.com"</span>,
        <span class="hl-str">"radius"</span>: <span class="hl-num">10</span>,
        <span class="hl-str">"responseMode"</span>: <span class="hl-str">"async"</span>,
    },
)
<span class="hl-var">job_id</span> <span class="hl-var">=</span> <span class="hl-var">resp</span>.<span class="hl-fn">json</span>()[<span class="hl-str">"jobId"</span>]
<span class="hl-fn">print</span>(<span class="hl-str">f"Job queued: {job_id}"</span>)</pre>
      </div>
      <div id="qs-node" class="tab-panel">
        <pre><span class="hl-kw">const</span> <span class="hl-var">API_KEY</span> <span class="hl-var">=</span> <span class="hl-str">'sk_live_YOUR_KEY'</span><span class="hl-var">;</span>
<span class="hl-kw">const</span> <span class="hl-var">BASE</span>    <span class="hl-var">=</span> <span class="hl-str">'${BASE_URL}'</span><span class="hl-var">;</span>

<span class="hl-kw">const</span> <span class="hl-var">resp</span> <span class="hl-var">=</span> <span class="hl-kw">await</span> <span class="hl-fn">fetch</span>(<span class="hl-str">\`\${BASE}/analyze\`</span>, {
  <span class="hl-key">method</span>: <span class="hl-str">'POST'</span>,
  <span class="hl-key">headers</span>: { <span class="hl-str">'X-API-Key'</span>: <span class="hl-var">API_KEY</span>, <span class="hl-str">'Content-Type'</span>: <span class="hl-str">'application/json'</span> },
  <span class="hl-key">body</span>: <span class="hl-var">JSON</span>.<span class="hl-fn">stringify</span>({ <span class="hl-key">url</span>: <span class="hl-str">'https://mamamiapizza.com'</span>, <span class="hl-key">radius</span>: <span class="hl-num">10</span> }),
});
<span class="hl-kw">const</span> { <span class="hl-var">jobId</span> } <span class="hl-var">=</span> <span class="hl-kw">await</span> <span class="hl-var">resp</span>.<span class="hl-fn">json</span>();
<span class="hl-var">console</span>.<span class="hl-fn">log</span>(<span class="hl-str">'Job queued:'</span>, <span class="hl-var">jobId</span>);</pre>
      </div>
    </div>

    <h3>Step 2 — Poll for completion</h3>
    <div class="code-tabs">
      <div class="tab-bar">
        <button class="tab-btn active" onclick="switchTab(this,'poll','curl')">cURL</button>
        <button class="tab-btn" onclick="switchTab(this,'poll','python')">Python</button>
        <button class="tab-btn" onclick="switchTab(this,'poll','node')">Node.js</button>
      </div>
      <div id="poll-curl" class="tab-panel active">
        <pre><span class="hl-curl">curl</span> ${BASE_URL}/jobs/<span class="hl-str">{jobId}</span> \\
  <span class="hl-flag">-H</span> <span class="hl-str">"X-API-Key: sk_live_YOUR_KEY"</span></pre>
      </div>
      <div id="poll-python" class="tab-panel">
        <pre><span class="hl-kw">import</span> <span class="hl-var">time</span>

<span class="hl-kw">while</span> <span class="hl-kw">True</span>:
    <span class="hl-var">job</span> <span class="hl-var">=</span> <span class="hl-var">requests</span>.<span class="hl-fn">get</span>(
        <span class="hl-str">f"{BASE}/jobs/{job_id}"</span>,
        <span class="hl-var">headers</span><span class="hl-var">=</span>{<span class="hl-str">"X-API-Key"</span>: <span class="hl-var">API_KEY</span>},
    ).<span class="hl-fn">json</span>()

    <span class="hl-kw">if</span> <span class="hl-var">job</span>[<span class="hl-str">"status"</span>] <span class="hl-var">==</span> <span class="hl-str">"completed"</span>:
        <span class="hl-var">report</span> <span class="hl-var">=</span> <span class="hl-var">job</span>[<span class="hl-str">"result"</span>]
        <span class="hl-kw">break</span>
    <span class="hl-kw">elif</span> <span class="hl-var">job</span>[<span class="hl-str">"status"</span>] <span class="hl-var">==</span> <span class="hl-str">"failed"</span>:
        <span class="hl-kw">raise</span> <span class="hl-fn">Exception</span>(<span class="hl-var">job</span>[<span class="hl-str">"error"</span>][<span class="hl-str">"message"</span>])

    <span class="hl-fn">print</span>(<span class="hl-str">f"  {job['progress']['percentComplete']}% — {job['progress']['currentStep']}"</span>)
    <span class="hl-var">time</span>.<span class="hl-fn">sleep</span>(<span class="hl-num">8</span>)</pre>
      </div>
      <div id="poll-node" class="tab-panel">
        <pre><span class="hl-kw">async function</span> <span class="hl-fn">waitForJob</span>(<span class="hl-var">jobId</span>) {
  <span class="hl-kw">while</span> (<span class="hl-kw">true</span>) {
    <span class="hl-kw">const</span> <span class="hl-var">job</span> <span class="hl-var">=</span> <span class="hl-kw">await</span> <span class="hl-fn">fetch</span>(<span class="hl-str">\`\${BASE}/jobs/\${jobId}\`</span>, {
      <span class="hl-key">headers</span>: { <span class="hl-str">'X-API-Key'</span>: <span class="hl-var">API_KEY</span> },
    }).<span class="hl-fn">then</span>(<span class="hl-var">r</span> <span class="hl-var">=></span> <span class="hl-var">r</span>.<span class="hl-fn">json</span>());

    <span class="hl-kw">if</span> (<span class="hl-var">job</span>.<span class="hl-var">status</span> <span class="hl-var">===</span> <span class="hl-str">'completed'</span>) <span class="hl-kw">return</span> <span class="hl-var">job</span>.<span class="hl-var">result</span>;
    <span class="hl-kw">if</span> (<span class="hl-var">job</span>.<span class="hl-var">status</span> <span class="hl-var">===</span> <span class="hl-str">'failed'</span>)   <span class="hl-kw">throw new</span> <span class="hl-fn">Error</span>(<span class="hl-var">job</span>.<span class="hl-var">error</span>.<span class="hl-var">message</span>);

    <span class="hl-kw">await new</span> <span class="hl-fn">Promise</span>(<span class="hl-var">r</span> <span class="hl-var">=></span> <span class="hl-fn">setTimeout</span>(<span class="hl-var">r</span>, <span class="hl-num">8000</span>));
  }
}</pre>
      </div>
    </div>

    <h3>Step 3 — Use the result</h3>
    <pre><span class="hl-comment"># Python example — print score and top gap</span>
<span class="hl-fn">print</span>(<span class="hl-str">f"Score: {report['data']['overallScore']}/100"</span>)
<span class="hl-fn">print</span>(<span class="hl-str">f"Market position: {report['data']['marketPosition']}"</span>)
<span class="hl-fn">print</span>(<span class="hl-str">f"Top gap: {report['data']['gaps'][0]['title']}"</span>)
<span class="hl-fn">print</span>(<span class="hl-str">f"  Impact: {report['data']['gaps'][0]['estimatedMonthlyRevenueImpact']}"</span>)</pre>
  </section>

  <!-- ── PLANS ── -->
  <section id="plans">
    <h2>Plans &amp; Rate Limits</h2>
    <p>All plans share the same API surface. Higher tiers unlock more calls, deeper analysis, and features like webhooks and AI search visibility scores.</p>

    <div class="plan-grid">
      <div class="plan-card">
        <div class="plan-name">Free</div>
        <div class="plan-price">$0<span>/mo</span></div>
        <div class="plan-feat"><b>100</b> calls/month</div>
        <div class="plan-feat"><b>2</b> calls/min</div>
        <div class="plan-feat">Preview depth (3 metrics)</div>
        <div class="plan-feat"><span class="cross">✗</span> Webhooks</div>
        <div class="plan-feat"><span class="cross">✗</span> AISPS</div>
      </div>
      <div class="plan-card featured">
        <div class="plan-name">Starter</div>
        <div class="plan-price">$29<span>/mo</span></div>
        <div class="plan-feat"><b>500</b> calls/month</div>
        <div class="plan-feat"><b>5</b> calls/min</div>
        <div class="plan-feat">Standard depth (all metrics)</div>
        <div class="plan-feat"><span class="check">✓</span> Webhooks</div>
        <div class="plan-feat"><span class="cross">✗</span> AISPS</div>
      </div>
      <div class="plan-card">
        <div class="plan-name">Professional</div>
        <div class="plan-price">$99<span>/mo</span></div>
        <div class="plan-feat"><b>2,000</b> calls/month</div>
        <div class="plan-feat"><b>10</b> calls/min</div>
        <div class="plan-feat">Deep depth + AISPS</div>
        <div class="plan-feat"><span class="check">✓</span> Webhooks</div>
        <div class="plan-feat"><span class="check">✓</span> AISPS</div>
      </div>
      <div class="plan-card">
        <div class="plan-name">Enterprise</div>
        <div class="plan-price">$299<span>/mo</span></div>
        <div class="plan-feat"><b>Unlimited</b> calls</div>
        <div class="plan-feat"><b>30</b> calls/min</div>
        <div class="plan-feat">Deep depth + AISPS</div>
        <div class="plan-feat"><span class="check">✓</span> Webhooks</div>
        <div class="plan-feat"><span class="check">✓</span> AISPS</div>
      </div>
    </div>

    <h3>Rate limit headers</h3>
    <p>Every response includes these headers so you can track your quota:</p>
    <table>
      <thead><tr><th>Header</th><th>Example</th><th>Description</th></tr></thead>
      <tbody>
        <tr><td><code>X-RateLimit-Limit</code></td><td><code>500</code></td><td>Monthly call quota</td></tr>
        <tr><td><code>X-RateLimit-Remaining</code></td><td><code>432</code></td><td>Calls left this month</td></tr>
        <tr><td><code>X-RateLimit-Plan</code></td><td><code>starter</code></td><td>Current plan name</td></tr>
        <tr><td><code>Retry-After</code></td><td><code>30</code></td><td>Seconds to wait (on 429)</td></tr>
      </tbody>
    </table>
  </section>

  <!-- ── ANALYZE ── -->
  <section id="analyze">
    <h2>POST /analyze</h2>
    <p>Submit a business URL for AI-powered competitive analysis. Returns a <code class="inline">jobId</code> immediately (async mode) or waits up to 120 seconds for the full result (sync mode).</p>

    <h3>Request body</h3>
    <table>
      <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
      <tbody>
        <tr><td><code>url</code></td><td>string</td><td>✓</td><td>Business website URL (must be HTTPS)</td></tr>
        <tr><td><code>radius</code></td><td>integer</td><td></td><td>Competitor search radius in miles. Default: <code>25</code>. Range: 1–100</td></tr>
        <tr><td><code>responseMode</code></td><td>string</td><td></td><td><code>async</code> (default) or <code>sync</code></td></tr>
        <tr><td><code>webhookUrl</code></td><td>string</td><td></td><td>HTTPS URL to POST the completed analysis to</td></tr>
        <tr><td><code>options.reportDepth</code></td><td>string</td><td></td><td><code>preview</code> / <code>standard</code> / <code>deep</code> — capped by plan</td></tr>
        <tr><td><code>metadata</code></td><td>object</td><td></td><td>Custom key/value pairs echoed back in the response</td></tr>
      </tbody>
    </table>

    <h3>Response — 202 (async)</h3>
    <pre>{
  <span class="hl-key">"jobId"</span>: <span class="hl-str">"a1b2c3d4-e5f6-7890-abcd-ef1234567890"</span>,
  <span class="hl-key">"status"</span>: <span class="hl-str">"queued"</span>,
  <span class="hl-key">"estimatedCompletionSeconds"</span>: <span class="hl-num">75</span>,
  <span class="hl-key">"createdAt"</span>: <span class="hl-str">"2026-05-31T18:00:00Z"</span>
}</pre>
  </section>

  <!-- ── JOBS ── -->
  <section id="jobs">
    <h2>GET /jobs/{jobId}</h2>
    <p>Poll every 5–10 seconds until <code class="inline">status</code> is <code class="inline">completed</code> or <code class="inline">failed</code>. The full report is in the <code class="inline">result</code> field when complete.</p>

    <h3>Response</h3>
    <pre>{
  <span class="hl-key">"jobId"</span>: <span class="hl-str">"a1b2c3d4-..."</span>,
  <span class="hl-key">"status"</span>: <span class="hl-str">"completed"</span>,          <span class="hl-comment">// queued | processing | completed | failed</span>
  <span class="hl-key">"progress"</span>: {
    <span class="hl-key">"currentStep"</span>: <span class="hl-str">"generating_recommendations"</span>,
    <span class="hl-key">"percentComplete"</span>: <span class="hl-num">90</span>
  },
  <span class="hl-key">"result"</span>: { <span class="hl-comment">/* AnalysisReport — see Response Format */</span> },
  <span class="hl-key">"completedAt"</span>: <span class="hl-str">"2026-05-31T18:01:15Z"</span>
}</pre>

    <div class="callout callout-warn">
      <span class="callout-icon">⏱</span>
      <div class="callout-text"><b>Recommended poll interval:</b> 8 seconds. Typical completion: 60–120 seconds. Jobs expire after 24 hours.</div>
    </div>
  </section>

  <!-- ── REPORTS ── -->
  <section id="reports">
    <h2>Reports</h2>

    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method method-GET">GET</span>
        <span class="endpoint-path">/reports</span>
        <span class="endpoint-desc">List all reports for this API key</span>
      </div>
      <div class="endpoint-body">
        <p>Returns paginated list of completed analyses.</p>
        <table>
          <thead><tr><th>Query param</th><th>Default</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>limit</code></td><td><code>20</code></td><td>Max records (max 100)</td></tr>
            <tr><td><code>offset</code></td><td><code>0</code></td><td>Pagination offset</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method method-GET">GET</span>
        <span class="endpoint-path">/reports/{reportId}</span>
        <span class="endpoint-desc">Retrieve a specific report</span>
      </div>
      <div class="endpoint-body">
        <p>Returns the full <code class="inline">AnalysisReport</code> object for the given report ID.</p>
      </div>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method method-POST">POST</span>
        <span class="endpoint-path">/reports/{reportId}/refresh</span>
        <span class="endpoint-desc">Re-run analysis for the same URL</span>
      </div>
      <div class="endpoint-body">
        <p>Queues a fresh analysis for the same URL and returns a new <code class="inline">jobId</code>. Useful for tracking changes over time.</p>
      </div>
    </div>
  </section>

  <!-- ── USAGE ── -->
  <section id="usage">
    <h2>GET /usage</h2>
    <p>Returns your current plan, monthly call quota, and feature flags.</p>

    <pre>{
  <span class="hl-key">"plan"</span>: <span class="hl-str">"starter"</span>,
  <span class="hl-key">"period"</span>: {
    <span class="hl-key">"start"</span>: <span class="hl-str">"2026-05-01T00:00:00Z"</span>,
    <span class="hl-key">"end"</span>: <span class="hl-str">"2026-05-31T23:59:59Z"</span>
  },
  <span class="hl-key">"calls"</span>: {
    <span class="hl-key">"used"</span>: <span class="hl-num">68</span>,
    <span class="hl-key">"limit"</span>: <span class="hl-num">500</span>,
    <span class="hl-key">"remaining"</span>: <span class="hl-num">432</span>
  },
  <span class="hl-key">"features"</span>: {
    <span class="hl-key">"webhooks"</span>: <span class="hl-kw">true</span>,
    <span class="hl-key">"llmVisibility"</span>: <span class="hl-kw">false</span>,
    <span class="hl-key">"maxRadius"</span>: <span class="hl-num">100</span>,
    <span class="hl-key">"reportDepth"</span>: <span class="hl-str">"standard"</span>
  },
  <span class="hl-key">"nextResetAt"</span>: <span class="hl-str">"2026-06-01T00:00:00Z"</span>
}</pre>
  </section>

  <!-- ── WEBHOOKS ── -->
  <section id="webhooks">
    <h2>Webhooks</h2>
    <p>Register an HTTPS endpoint to receive analysis results instead of polling. Requires Starter plan or higher.</p>

    <h3>Register a webhook</h3>
    <pre><span class="hl-curl">curl</span> <span class="hl-flag">-X POST</span> ${BASE_URL}/webhooks \\
  <span class="hl-flag">-H</span> <span class="hl-str">"X-API-Key: sk_live_YOUR_KEY"</span> \\
  <span class="hl-flag">-H</span> <span class="hl-str">"Content-Type: application/json"</span> \\
  <span class="hl-flag">-d</span> <span class="hl-str">'{
    "url": "https://yourapp.com/hooks/siteanalyzer",
    "events": ["analysis.completed", "analysis.failed"]
  }'</span></pre>

    <h3>Verifying signatures</h3>
    <p>Every delivery includes a <code class="inline">X-SiteAnalyzer-Signature</code> header containing an HMAC-SHA256 signature of the raw request body, signed with your webhook's secret.</p>

    <div class="code-tabs">
      <div class="tab-bar">
        <button class="tab-btn active" onclick="switchTab(this,'sig','python')">Python</button>
        <button class="tab-btn" onclick="switchTab(this,'sig','node')">Node.js</button>
      </div>
      <div id="sig-python" class="tab-panel active">
        <pre><span class="hl-kw">import</span> <span class="hl-var">hmac</span>, <span class="hl-var">hashlib</span>

<span class="hl-kw">def</span> <span class="hl-fn">verify_webhook</span>(<span class="hl-var">body</span>: <span class="hl-var">bytes</span>, <span class="hl-var">signature</span>: <span class="hl-var">str</span>, <span class="hl-var">secret</span>: <span class="hl-var">str</span>) <span class="hl-var">-></span> <span class="hl-var">bool</span>:
    <span class="hl-var">expected</span> <span class="hl-var">=</span> <span class="hl-str">"sha256="</span> <span class="hl-var">+</span> <span class="hl-var">hmac</span>.<span class="hl-fn">new</span>(
        <span class="hl-var">secret</span>.<span class="hl-fn">encode</span>(), <span class="hl-var">body</span>, <span class="hl-var">hashlib</span>.<span class="hl-var">sha256</span>
    ).<span class="hl-fn">hexdigest</span>()
    <span class="hl-kw">return</span> <span class="hl-var">hmac</span>.<span class="hl-fn">compare_digest</span>(<span class="hl-var">expected</span>, <span class="hl-var">signature</span>)</pre>
      </div>
      <div id="sig-node" class="tab-panel">
        <pre><span class="hl-kw">const</span> <span class="hl-var">crypto</span> <span class="hl-var">=</span> <span class="hl-fn">require</span>(<span class="hl-str">'crypto'</span>);

<span class="hl-kw">function</span> <span class="hl-fn">verifyWebhook</span>(<span class="hl-var">body</span>, <span class="hl-var">signature</span>, <span class="hl-var">secret</span>) {
  <span class="hl-kw">const</span> <span class="hl-var">expected</span> <span class="hl-var">=</span> <span class="hl-str">'sha256='</span> <span class="hl-var">+</span>
    <span class="hl-var">crypto</span>.<span class="hl-fn">createHmac</span>(<span class="hl-str">'sha256'</span>, <span class="hl-var">secret</span>)
          .<span class="hl-fn">update</span>(<span class="hl-var">body</span>)
          .<span class="hl-fn">digest</span>(<span class="hl-str">'hex'</span>);
  <span class="hl-kw">return</span> <span class="hl-var">crypto</span>.<span class="hl-fn">timingSafeEqual</span>(
    <span class="hl-var">Buffer</span>.<span class="hl-fn">from</span>(<span class="hl-var">expected</span>), <span class="hl-var">Buffer</span>.<span class="hl-fn">from</span>(<span class="hl-var">signature</span>)
  );
}</pre>
      </div>
    </div>

    <h3>Webhook events</h3>
    <table>
      <thead><tr><th>Event</th><th>Triggered when</th></tr></thead>
      <tbody>
        <tr><td><code>analysis.completed</code></td><td>Analysis job finishes successfully</td></tr>
        <tr><td><code>analysis.failed</code></td><td>Analysis job fails after retries</td></tr>
        <tr><td><code>report.refreshed</code></td><td>A report refresh completes</td></tr>
      </tbody>
    </table>

    <h3>Retry policy</h3>
    <p>Failed deliveries are retried with exponential backoff: <strong>1 min → 5 min → 30 min → 2 hr → 24 hr</strong>. After 5 failed attempts the webhook is marked inactive. Your endpoint must return a 2xx status within 10 seconds.</p>
  </section>

  <!-- ── RESPONSE FORMAT ── -->
  <section id="response-format">
    <h2>Response Format</h2>
    <p>All responses are JSON. A successful analysis report looks like this:</p>

    <pre>{
  <span class="hl-key">"reportId"</span>: <span class="hl-str">"uuid"</span>,
  <span class="hl-key">"url"</span>: <span class="hl-str">"https://mamamiapizza.com"</span>,
  <span class="hl-key">"reportType"</span>: <span class="hl-str">"competitive"</span>,
  <span class="hl-key">"radiusMi"</span>: <span class="hl-num">10</span>,
  <span class="hl-key">"createdAt"</span>: <span class="hl-str">"2026-05-31T18:01:15Z"</span>,
  <span class="hl-key">"data"</span>: {
    <span class="hl-key">"businessName"</span>: <span class="hl-str">"Mama Mia Pizza &amp; Subs"</span>,
    <span class="hl-key">"businessType"</span>: <span class="hl-str">"Italian restaurant / pizzeria"</span>,
    <span class="hl-key">"location"</span>: <span class="hl-str">"Chicago, IL"</span>,
    <span class="hl-key">"overallScore"</span>: <span class="hl-num">72</span>,
    <span class="hl-key">"marketPosition"</span>: <span class="hl-str">"Challenger"</span>,
    <span class="hl-key">"executiveSummary"</span>: <span class="hl-str">"Solid local presence but missing delivery app integrations..."</span>,

    <span class="hl-key">"scores"</span>: {
      <span class="hl-key">"seo"</span>: <span class="hl-num">65</span>,
      <span class="hl-key">"digital"</span>: <span class="hl-num">70</span>,
      <span class="hl-key">"content"</span>: <span class="hl-num">78</span>,
      <span class="hl-key">"ux"</span>: <span class="hl-num">75</span>
    },

    <span class="hl-key">"competitors"</span>: [
      {
        <span class="hl-key">"name"</span>: <span class="hl-str">"Chicago's Best Pizza"</span>,
        <span class="hl-key">"url"</span>: <span class="hl-str">"https://chicagosbestpizza.com"</span>,
        <span class="hl-key">"score"</span>: <span class="hl-num">84</span>,
        <span class="hl-key">"marketPosition"</span>: <span class="hl-str">"Leader"</span>,
        <span class="hl-key">"description"</span>: <span class="hl-str">"Dominant digital presence with online ordering..."</span>,
        <span class="hl-key">"tags"</span>: [<span class="hl-str">"Online Ordering"</span>, <span class="hl-str">"Loyalty Program"</span>, <span class="hl-str">"Strong SEO"</span>]
      }
    ],

    <span class="hl-key">"gaps"</span>: [
      {
        <span class="hl-key">"title"</span>: <span class="hl-str">"No delivery app integrations"</span>,
        <span class="hl-key">"priority"</span>: <span class="hl-str">"Critical"</span>,
        <span class="hl-key">"competitor"</span>: <span class="hl-str">"Chicago's Best Pizza"</span>,
        <span class="hl-key">"estimatedMonthlyRevenueImpact"</span>: <span class="hl-str">"$3,000–$5,000"</span>
      }
    ],

    <span class="hl-key">"recommendations"</span>: [
      {
        <span class="hl-key">"title"</span>: <span class="hl-str">"Launch on DoorDash and Uber Eats"</span>,
        <span class="hl-key">"priority"</span>: <span class="hl-num">1</span>,
        <span class="hl-key">"effort"</span>: <span class="hl-str">"Low"</span>,
        <span class="hl-key">"impact"</span>: <span class="hl-str">"High"</span>,
        <span class="hl-key">"timeframe"</span>: <span class="hl-str">"Immediate"</span>,
        <span class="hl-key">"estimatedCost"</span>: <span class="hl-str">"$0 upfront, 15–30% commission"</span>,
        <span class="hl-key">"steps"</span>: [<span class="hl-str">"Create DoorDash merchant account"</span>, <span class="hl-str">"Upload menu with photos"</span>, <span class="hl-str">"..."</span>]
      }
    ]
  }
}</pre>
  </section>

  <!-- ── ERRORS ── -->
  <section id="errors">
    <h2>Error Codes</h2>
    <p>Errors always return a JSON body with an <code class="inline">error</code> object.</p>
    <pre>{
  <span class="hl-key">"error"</span>: {
    <span class="hl-key">"code"</span>: <span class="hl-str">"QUOTA_EXCEEDED"</span>,
    <span class="hl-key">"message"</span>: <span class="hl-str">"Monthly quota of 100 calls exceeded. Upgrade at siteanalyzerpro.com/pricing"</span>
  }
}</pre>

    <table>
      <thead><tr><th>HTTP</th><th>Code</th><th>Meaning</th></tr></thead>
      <tbody>
        <tr>
          <td><span class="status s4xx">400</span></td>
          <td><code>INVALID_URL</code></td>
          <td>URL is malformed, private/local, or points to a non-business page</td>
        </tr>
        <tr>
          <td><span class="status s4xx">400</span></td>
          <td><code>INVALID_JSON</code></td>
          <td>Request body is not valid JSON</td>
        </tr>
        <tr>
          <td><span class="status s4xx">401</span></td>
          <td><code>INVALID_API_KEY</code></td>
          <td>Missing, revoked, or malformed API key</td>
        </tr>
        <tr>
          <td><span class="status s4xx">402</span></td>
          <td><code>QUOTA_EXCEEDED</code></td>
          <td>Monthly call quota exhausted — resets 1st of next month</td>
        </tr>
        <tr>
          <td><span class="status s4xx">402</span></td>
          <td><code>PLAN_REQUIRED</code></td>
          <td>Feature not available on your current plan (e.g. AISPS requires Professional)</td>
        </tr>
        <tr>
          <td><span class="status s4xx">404</span></td>
          <td><code>NOT_FOUND</code></td>
          <td>Job or report ID does not exist or belongs to a different key</td>
        </tr>
        <tr>
          <td><span class="status s4xx">429</span></td>
          <td><code>RATE_LIMITED</code></td>
          <td>Per-minute rate limit hit — check <code>Retry-After</code> header</td>
        </tr>
        <tr>
          <td><span class="status s5xx">500</span></td>
          <td><code>INTERNAL_ERROR</code></td>
          <td>Unexpected server error — retry with backoff; contact support if persistent</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- ── HEADERS ── -->
  <section id="headers">
    <h2>Response Headers</h2>
    <table>
      <thead><tr><th>Header</th><th>Description</th></tr></thead>
      <tbody>
        <tr><td><code>X-RateLimit-Limit</code></td><td>Monthly call quota for your plan (<code>unlimited</code> for Enterprise)</td></tr>
        <tr><td><code>X-RateLimit-Remaining</code></td><td>Calls remaining this calendar month</td></tr>
        <tr><td><code>X-RateLimit-Plan</code></td><td>Your current plan: <code>free</code> / <code>starter</code> / <code>professional</code> / <code>enterprise</code></td></tr>
        <tr><td><code>X-SiteAnalyzer-Signature</code></td><td>HMAC-SHA256 signature on webhook deliveries (format: <code>sha256=hex</code>)</td></tr>
        <tr><td><code>Retry-After</code></td><td>Seconds to wait before retrying (present on <code>429</code> responses)</td></tr>
      </tbody>
    </table>
  </section>

</main>

<script>
function switchTab(btn, group, id) {
  const bar = btn.closest('.tab-bar');
  bar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const container = bar.closest('.code-tabs');
  container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(group + '-' + id).classList.add('active');
}

// Highlight active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-link[href^="#"]');
const observer  = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
      });
    }
  });
}, { rootMargin: '-20% 0px -75% 0px' });
sections.forEach(s => observer.observe(s));
</script>
</body>
</html>`);
});

export default router;
