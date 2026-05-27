import { AnalysisData } from '../types';

const DISCLAIMER_TEXT = 'This report is provided for informational purposes only and does not constitute legal, financial, or professional advice. SiteAnalyzer Pro is not responsible for any business decisions made based on the information contained in this report.';

const disclaimerBlock = `
<div class="disclaimer">
  <strong>Disclaimer:</strong> ${DISCLAIMER_TEXT}
</div>`;

const priorityColor = (p: string) => {
  const map: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
  };
  return map[p] || '#6b7280';
};

const scoreColor = (s: number) => {
  if (s >= 80) return '#22c55e';
  if (s >= 60) return '#eab308';
  return '#ef4444';
};

export function generateHtmlReport(data: AnalysisData, url: string, generatedAt: string): string {
  const now = new Date(generatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const competitorCards = data.competitors.map(c => `
    <div class="card competitor-card">
      <div class="competitor-header">
        <div>
          <h3>${c.name}</h3>
          <a href="${c.url}" target="_blank" rel="noopener noreferrer">${c.url}</a>
        </div>
        <div class="score-badge" style="background:${scoreColor(c.score)}">${c.score}</div>
      </div>
      <p>${c.description}</p>
      <div class="tags">${c.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </div>
  `).join('');

  const strengthCards = data.strengths.map(s => `
    <div class="card">
      <div class="card-header">
        <h4>${s.title}</h4>
        <span class="badge badge-green">${s.category}</span>
      </div>
      <p>${s.description}</p>
      <div class="score-bar">
        <div class="score-bar-fill" style="width:${s.score}%;background:${scoreColor(s.score)}"></div>
      </div>
      <small>${s.score}/100</small>
    </div>
  `).join('');

  const weaknessCards = data.weaknesses.map(w => `
    <div class="card">
      <div class="card-header">
        <h4>${w.title}</h4>
        <span class="badge" style="background:${priorityColor(w.impact)};color:white">${w.impact}</span>
      </div>
      <p>${w.description}</p>
      <small class="muted">${w.category}</small>
    </div>
  `).join('');

  const gapCards = data.gaps.map(g => `
    <div class="card gap-card" style="border-left:4px solid ${priorityColor(g.priority)}">
      <div class="card-header">
        <h4>${g.title}</h4>
        <span class="badge" style="background:${priorityColor(g.priority)};color:white">${g.priority}</span>
      </div>
      <p>${g.description}</p>
      <small class="muted">Better at this: <strong>${g.competitor}</strong> · Category: ${g.category}</small>
    </div>
  `).join('');

  const solutionCards = data.solutions.map(s => `
    <div class="card solution-card">
      <div class="card-header">
        <h4>${s.title}</h4>
        <div class="badges">
          <span class="badge badge-blue">${s.timeframe}</span>
          <span class="badge badge-purple">Impact: ${s.impact}</span>
          <span class="badge badge-gray">Effort: ${s.effort}</span>
        </div>
      </div>
      <p>${s.description}</p>
      <div class="solution-meta">
        <strong>Estimated Cost:</strong> ${s.estimatedCost}
      </div>
      <ol class="steps">
        ${s.steps.map(step => `<li>${step}</li>`).join('')}
      </ol>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.businessName} — Competitive Analysis Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; color: #1e293b; background: #f8fafc; line-height: 1.6; }
    h1,h2,h3,h4 { font-family: 'Syne', sans-serif; }

    .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white; padding: 48px; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px; }
    .brand { font-size: 14px; opacity: 0.8; margin-bottom: 8px; font-family: 'Syne', sans-serif; letter-spacing: 0.1em; text-transform: uppercase; }
    .header h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
    .header .subtitle { opacity: 0.8; font-size: 16px; }
    .overall-score { text-align: center; background: white/10; backdrop-filter: blur(8px); border-radius: 16px; padding: 24px 32px; border: 1px solid rgba(255,255,255,0.2); }
    .overall-score .score-number { font-size: 56px; font-weight: 800; font-family: 'Syne', sans-serif; }
    .overall-score .score-label { font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.1em; }
    .position-badge { display: inline-block; padding: 4px 14px; background: rgba(255,255,255,0.2); border-radius: 999px; font-size: 13px; margin-top: 8px; }

    .container { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
    section { margin-bottom: 48px; }
    section h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }

    .executive-summary { background: white; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-size: 16px; line-height: 1.7; color: #475569; }

    .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
    .score-card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .score-card h3 { font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .score-card .big-score { font-size: 42px; font-weight: 800; font-family: 'Syne', sans-serif; }
    .score-card ul { margin-top: 12px; padding-left: 0; list-style: none; }
    .score-card ul li { font-size: 13px; color: #64748b; padding: 4px 0; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; gap: 6px; }
    .score-card ul li::before { content: '→'; color: #94a3b8; flex-shrink: 0; }

    .card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 16px; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .card h4 { font-size: 16px; font-weight: 700; color: #1e293b; }
    .card p { color: #475569; font-size: 15px; }
    .card small { color: #94a3b8; font-size: 13px; }
    .muted { color: #94a3b8 !important; }

    .competitor-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .competitor-header h3 { font-size: 17px; font-weight: 700; margin-bottom: 2px; }
    .competitor-header a { font-size: 13px; color: #2563eb; text-decoration: none; }
    .score-badge { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px; flex-shrink: 0; }

    .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .tag { background: #f1f5f9; color: #475569; font-size: 12px; padding: 4px 10px; border-radius: 999px; }

    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-purple { background: #f3e8ff; color: #7e22ce; }
    .badge-gray { background: #f1f5f9; color: #475569; }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; }

    .score-bar { height: 6px; background: #f1f5f9; border-radius: 999px; margin: 10px 0 4px; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 999px; transition: width 0.5s; }

    .gap-card { border-left-width: 4px !important; border-left-style: solid; }

    .solution-meta { font-size: 14px; color: #64748b; margin: 10px 0; }
    .steps { padding-left: 20px; margin-top: 12px; }
    .steps li { font-size: 14px; color: #475569; padding: 4px 0; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }

    .disclaimer { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; font-size: 13px; color: #92400e; line-height: 1.6; margin-bottom: 32px; }
    .footer { text-align: center; padding: 32px; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; margin-top: 48px; }
    .footer strong { color: #1e293b; }

    .meta-bar { background: white; border-bottom: 1px solid #e2e8f0; padding: 12px 24px; font-size: 13px; color: #64748b; display: flex; gap: 24px; flex-wrap: wrap; }
    .meta-bar span { display: flex; align-items: center; gap: 6px; }

    @media print {
      body { background: white; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .card { break-inside: avoid; }
      section { break-inside: avoid; }
    }
  </style>
</head>
<body>

<div class="header">
  <div class="header-top">
    <div>
      <div class="brand">SiteAnalyzer Pro</div>
      <h1>${data.businessName}</h1>
      <div class="subtitle">${data.businessType} · ${data.location}</div>
      <div class="position-badge" style="margin-top:12px">Market Position: ${data.marketPosition}</div>
    </div>
    <div class="overall-score">
      <div class="score-number" style="color:${scoreColor(data.overallScore)}">${data.overallScore}</div>
      <div class="score-label">Overall Score</div>
    </div>
  </div>
</div>

<div class="meta-bar">
  <span>📅 Generated: ${now}</span>
  <span>🌐 Analyzed: ${url}</span>
  <span>📊 Report by SiteAnalyzer Pro</span>
</div>

<div class="container">

  ${disclaimerBlock}

  <section>
    <h2>Executive Summary</h2>
    <div class="executive-summary">${data.executiveSummary}</div>
  </section>

  <section>
    <h2>Performance Scores</h2>
    <div class="score-grid">
      <div class="score-card">
        <h3>SEO</h3>
        <div class="big-score" style="color:${scoreColor(data.seoScore)}">${data.seoScore}</div>
        <ul>${data.seoFindings.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
      <div class="score-card">
        <h3>Digital Presence</h3>
        <div class="big-score" style="color:${scoreColor(data.digitalScore)}">${data.digitalScore}</div>
        <ul>${data.digitalFindings.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
      <div class="score-card">
        <h3>Content</h3>
        <div class="big-score" style="color:${scoreColor(data.contentScore)}">${data.contentScore}</div>
        <ul>${data.contentFindings.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
      <div class="score-card">
        <h3>UX / Design</h3>
        <div class="big-score" style="color:${scoreColor(data.uxScore)}">${data.uxScore}</div>
        <ul>${data.uxFindings.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
    </div>
  </section>

  <section>
    <h2>Competitor Analysis</h2>
    ${competitorCards}
  </section>

  <section>
    <h2>Strengths</h2>
    <div class="cards-grid">${strengthCards}</div>
  </section>

  <section>
    <h2>Weaknesses</h2>
    <div class="cards-grid">${weaknessCards}</div>
  </section>

  <section>
    <h2>Gap Analysis</h2>
    ${gapCards}
  </section>

  <section>
    <h2>Strategic Recommendations</h2>
    ${solutionCards}
  </section>

  ${disclaimerBlock}

</div>

<div class="footer">
  <p>Generated by <strong>SiteAnalyzer Pro</strong> · AI-Powered Competitive Intelligence</p>
  <p style="margin-top:4px">${now} · For informational purposes only</p>
</div>

</body>
</html>`;
}
