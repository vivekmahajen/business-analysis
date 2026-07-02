import { ReviewIntelligenceData } from '../types';

function severityColor(s: string) {
  if (s === 'high') return '#ef4444';
  if (s === 'medium') return '#f59e0b';
  return '#6b7280';
}

export function generateReviewHtmlReport(data: ReviewIntelligenceData, url: string, generatedAt: string): string {
  const now = new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const { meta, overall_sentiment: os, aspects, loves, pain_points, signals, recommendations, limitations } = data;
  const total = (os?.positive || 0) + (os?.neutral || 0) + (os?.negative || 0) + (os?.mixed || 0);

  function pct(n: number) { return total > 0 ? Math.round((n / total) * 100) : 0; }

  const sentimentBar = `
    <div class="sentiment-bar">
      ${os?.positive > 0 ? `<div style="width:${pct(os.positive)}%;background:#22c55e" title="Positive ${os.positive}"></div>` : ''}
      ${os?.mixed > 0 ? `<div style="width:${pct(os.mixed)}%;background:#f59e0b" title="Mixed ${os.mixed}"></div>` : ''}
      ${os?.neutral > 0 ? `<div style="width:${pct(os.neutral)}%;background:#d1d5db" title="Neutral ${os.neutral}"></div>` : ''}
      ${os?.negative > 0 ? `<div style="width:${pct(os.negative)}%;background:#ef4444" title="Negative ${os.negative}"></div>` : ''}
    </div>`;

  const aspectRows = (aspects || []).map(a => {
    const aTotal = a.positive + a.neutral + a.negative;
    const aPos = aTotal > 0 ? Math.round((a.positive / aTotal) * 100) : 0;
    const aNeu = aTotal > 0 ? Math.round((a.neutral / aTotal) * 100) : 0;
    const aNeg = aTotal > 0 ? Math.round((a.negative / aTotal) * 100) : 0;
    return `
    <tr>
      <td style="text-transform:capitalize;font-weight:600">${a.aspect}</td>
      <td>
        <div class="mini-bar">
          ${a.positive > 0 ? `<div style="width:${aPos}%;background:#22c55e"></div>` : ''}
          ${a.neutral > 0 ? `<div style="width:${aNeu}%;background:#d1d5db"></div>` : ''}
          ${a.negative > 0 ? `<div style="width:${aNeg}%;background:#ef4444"></div>` : ''}
        </div>
        <div class="mini-counts">
          ${a.positive > 0 ? `<span style="color:#16a34a">+${a.positive}</span>` : ''}
          ${a.neutral > 0 ? `<span style="color:#9ca3af">${a.neutral}~</span>` : ''}
          ${a.negative > 0 ? `<span style="color:#dc2626">−${a.negative}</span>` : ''}
        </div>
      </td>
      <td style="text-align:center">${a.frequency}</td>
      <td style="font-style:italic;color:#6b7280;font-size:12px">${a.example ? `"${a.example}"` : ''}${a.note ? ` <span style="color:#d97706;font-style:normal">⚠ ${a.note}</span>` : ''}</td>
    </tr>`;
  }).join('');

  const loveCards = (loves || []).map(l => `
    <div class="love-card">
      <div class="love-header">
        <span class="love-theme">${l.theme}</span>
        <span class="badge badge-green">${l.frequency} mention${l.frequency !== 1 ? 's' : ''}</span>
      </div>
      ${l.example ? `<p class="love-quote">"${l.example}"</p>` : ''}
    </div>`).join('');

  const painCards = (pain_points || []).map(p => `
    <div class="pain-card" style="border-left:4px solid ${severityColor(p.severity)}">
      <div class="pain-header">
        <span class="pain-theme">${p.theme}</span>
        <div class="badges">
          <span class="badge" style="background:${severityColor(p.severity)}20;color:${severityColor(p.severity)};border:1px solid ${severityColor(p.severity)}40">${p.severity} severity</span>
          ${p.safety_flag ? '<span class="badge badge-red">⚠ Safety/Legal — verify</span>' : ''}
          <span class="badge badge-gray">${p.frequency} mention${p.frequency !== 1 ? 's' : ''}</span>
        </div>
      </div>
      ${p.example ? `<p class="pain-quote">"${p.example}"</p>` : ''}
    </div>`).join('');

  const quickWins = (recommendations || []).filter(r => r.type === 'quick_win');
  const structural = (recommendations || []).filter(r => r.type === 'structural');

  function recCards(recs: typeof recommendations, color: string) {
    return recs.map(r => `
    <div class="rec-card" style="border-left:4px solid ${color}">
      <div class="rec-theme">Re: ${r.theme}</div>
      <p class="rec-action">${r.action}</p>
      <div class="rec-meta">
        <div><strong>Expected impact</strong> <em>(hypothesis)</em><p>${r.expected_impact}</p></div>
        <div><strong>How to measure</strong><p>${r.how_to_measure}</p></div>
      </div>
    </div>`).join('');
  }

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.business?.name || 'Business'} — Review Intelligence</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;color:#1e293b;background:#f8fafc;line-height:1.6}
    h1,h2,h3,h4{font-family:'Syne',sans-serif}
    .header{background:linear-gradient(135deg,#4c1d95 0%,#7c3aed 100%);color:white;padding:48px}
    .brand{font-size:13px;opacity:.7;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
    .header h1{font-size:30px;font-weight:800;margin-bottom:6px}
    .header .sub{color:rgba(255,255,255,.7);font-size:14px;margin-bottom:16px}
    .header-meta{display:flex;gap:12px;flex-wrap:wrap;font-size:13px;color:rgba(255,255,255,.6);margin-bottom:20px}
    .stat-row{display:flex;gap:16px;flex-wrap:wrap}
    .stat{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:16px 24px;text-align:center}
    .stat-num{font-family:'Syne',sans-serif;font-size:28px;font-weight:800}
    .stat-label{font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
    .sentiment-bar{display:flex;height:10px;border-radius:999px;overflow:hidden;margin-top:20px;gap:2px}
    .sentiment-bar div{border-radius:999px}
    .container{max-width:1000px;margin:0 auto;padding:40px 24px}
    section{margin-bottom:48px}
    section h2{font-size:20px;font-weight:700;color:#0f172a;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #e2e8f0}
    .h3-label{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px}
    table{width:100%;border-collapse:collapse;font-size:13px;background:white;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.05)}
    th{text-align:left;padding:10px 16px;background:#f8fafc;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #e2e8f0}
    td{padding:12px 16px;border-bottom:1px solid #f1f5f9;vertical-align:top}
    tr:last-child td{border-bottom:none}
    .mini-bar{display:flex;height:6px;border-radius:999px;overflow:hidden;width:120px;margin-bottom:4px;gap:1px}
    .mini-counts{display:flex;gap:6px;font-size:11px}
    .love-card{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:18px;margin-bottom:12px}
    .love-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px}
    .love-theme{font-weight:600;color:#14532d}
    .love-quote{font-style:italic;color:#166534;font-size:13px}
    .pain-card{background:white;border-radius:14px;padding:18px;margin-bottom:12px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.04)}
    .pain-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;flex-wrap:wrap}
    .pain-theme{font-weight:600;color:#0f172a}
    .pain-quote{font-style:italic;color:#64748b;font-size:13px}
    .badges{display:flex;flex-wrap:wrap;gap:6px}
    .badge{font-size:11px;padding:2px 8px;border-radius:999px;font-weight:500}
    .badge-green{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}
    .badge-red{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
    .badge-gray{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}
    .signals-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:16px}
    .signal-card{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.04)}
    .signal-num{font-family:'Syne',sans-serif;font-size:26px;font-weight:800}
    .signal-label{font-size:12px;color:#64748b;margin-top:2px;font-weight:500}
    .signal-sub{font-size:11px;color:#94a3b8;margin-top:2px}
    .alert-box{border-radius:10px;padding:12px 16px;font-size:13px;margin-bottom:10px}
    .alert-amber{background:#fffbeb;border:1px solid #fde68a;color:#92400e}
    .alert-green{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534}
    .alert-red{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}
    .rec-card{background:white;border-radius:14px;padding:18px;margin-bottom:12px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.04)}
    .rec-theme{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#7c3aed;margin-bottom:6px}
    .rec-action{font-weight:600;color:#0f172a;margin-bottom:12px}
    .rec-meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:12px;color:#475569}
    .rec-meta p{color:#64748b;margin-top:2px}
    .confidence-box{border-radius:14px;padding:20px;font-size:13px;line-height:1.6}
    footer{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px}
  </style>
</head>
<body>
<div class="header">
  <div class="brand">Review Intelligence — SiteAnalyzer Pro</div>
  <h1>${data.business?.name || 'Business Review Analysis'}</h1>
  <div class="sub" dir="ltr">${url}</div>
  <div class="header-meta">
    <span>${now}</span>
    ${meta?.sources?.length > 0 ? `<span>· ${meta.sources.join(', ')}</span>` : ''}
    ${data.business?.vertical ? `<span>· ${data.business.vertical}</span>` : ''}
  </div>
  <div class="stat-row">
    <div class="stat"><div class="stat-num">${meta?.reviews_analyzed || 0}</div><div class="stat-label">Reviews</div></div>
    ${meta?.avg_rating != null ? `<div class="stat"><div class="stat-num">${meta.avg_rating.toFixed(1)}</div><div class="stat-label">Avg Rating</div></div>` : ''}
    <div class="stat"><div class="stat-num" style="text-transform:capitalize">${meta?.confidence || 'low'}</div><div class="stat-label">Confidence</div></div>
    <div class="stat"><div class="stat-num">${os?.positive || 0}</div><div class="stat-label">Positive</div></div>
    <div class="stat"><div class="stat-num">${os?.negative || 0}</div><div class="stat-label">Negative</div></div>
  </div>
  ${sentimentBar}
</div>

<div class="container">

  ${aspects?.length > 0 ? `
  <section>
    <h2>Aspect Sentiment</h2>
    <table>
      <thead><tr><th>Aspect</th><th>Sentiment</th><th>Mentions</th><th>Example</th></tr></thead>
      <tbody>${aspectRows}</tbody>
    </table>
  </section>` : ''}

  ${loves?.length > 0 ? `
  <section>
    <h2>What Customers Love</h2>
    ${loveCards}
  </section>` : ''}

  ${pain_points?.length > 0 ? `
  <section>
    <h2>What's Hurting Them</h2>
    ${painCards}
  </section>` : ''}

  ${signals ? `
  <section>
    <h2>Notable Signals</h2>
    <div class="signals-grid">
      <div class="signal-card"><div class="signal-num" style="color:${signals.trend==='improving'?'#16a34a':signals.trend==='declining'?'#dc2626':'#3b82f6'}">${signals.trend==='improving'?'↑':signals.trend==='declining'?'↓':signals.trend==='stable'?'→':'?'}</div><div class="signal-label">Trend</div><div class="signal-sub">${signals.trend.replace('_',' ')}</div></div>
      <div class="signal-card"><div class="signal-num" style="color:#d97706">${signals.rating_text_mismatches}</div><div class="signal-label">Rating/Text Mismatches</div></div>
      <div class="signal-card"><div class="signal-num" style="color:#ef4444">${meta?.suspected_fake_count||0}</div><div class="signal-label">Suspected Fake</div></div>
      <div class="signal-card"><div class="signal-num" style="color:#3b82f6">${signals.emerging?.length||0}</div><div class="signal-label">Emerging Issues</div></div>
    </div>
    ${signals.emerging?.length > 0 ? `<div class="alert-box alert-amber"><strong>Emerging:</strong> ${signals.emerging.join(' · ')}</div>` : ''}
    ${signals.resolved?.length > 0 ? `<div class="alert-box alert-green"><strong>Resolved:</strong> ${signals.resolved.join(' · ')}</div>` : ''}
    ${signals.suspected_fake?.length > 0 ? `<div class="alert-box alert-red"><strong>Suspected fake/spam:</strong> ${signals.suspected_fake.join(' · ')}</div>` : ''}
  </section>` : ''}

  ${recommendations?.length > 0 ? `
  <section>
    <h2>Recommendations</h2>
    ${quickWins.length > 0 ? `<div class="h3-label" style="color:#16a34a">⚡ Quick Wins</div>${recCards(quickWins, '#22c55e')}` : ''}
    ${structural.length > 0 ? `<div class="h3-label" style="color:#1d4ed8;margin-top:24px">🏗 Structural Changes</div>${recCards(structural, '#3b82f6')}` : ''}
  </section>` : ''}

  <section>
    <h2>Confidence &amp; Limitations</h2>
    <div class="confidence-box" style="background:${meta?.confidence==='high'?'#f0fdf4':meta?.confidence==='moderate'?'#fffbeb':'#fef2f2'};border:1px solid ${meta?.confidence==='high'?'#bbf7d0':meta?.confidence==='moderate'?'#fde68a':'#fecaca'}">
      <strong style="color:${meta?.confidence==='high'?'#166534':meta?.confidence==='moderate'?'#92400e':'#991b1b'}">Confidence: ${(meta?.confidence||'low').charAt(0).toUpperCase()+(meta?.confidence||'low').slice(1)}</strong>
      <p style="margin-top:6px;color:#475569">${meta?.confidence_reason || ''}</p>
      ${limitations ? `<p style="margin-top:6px;color:#475569">${limitations}</p>` : ''}
      <p style="margin-top:10px;color:#94a3b8;font-size:12px">Analysis covers ${meta?.reviews_analyzed||0} reviews from ${meta?.date_range||'unknown period'}. Reviewer pools skew toward extreme opinions — the silent majority is not represented. All recommendations are hypotheses; validate with your own operational data.</p>
    </div>
  </section>

  <footer>Review Intelligence by <strong>SiteAnalyzer Pro</strong> · ${now} · ${url}</footer>
</div>
</body>
</html>`;
}
