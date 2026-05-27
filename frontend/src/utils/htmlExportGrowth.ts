import { GrowthAdvisorData } from '../types';

const DISCLAIMER_TEXT = 'This report is provided for informational purposes only and does not constitute legal, financial, or professional advice. SiteAnalyzer Pro is not responsible for any business decisions made based on the information contained in this report.';

const effortColor = (e: string) => {
  const map: Record<string, string> = { Low: '#22c55e', Medium: '#eab308', High: '#ef4444' };
  return map[e] || '#6b7280';
};

const categoryLabel: Record<string, string> = {
  A: 'Product Expansion',
  B: 'Pricing & Bundling',
  C: 'New Sales Channels',
  D: 'Marketing & Audience',
  E: 'Operational Levers',
};

const categoryColor: Record<string, string> = {
  A: '#1d4ed8',
  B: '#7e22ce',
  C: '#15803d',
  D: '#c2410c',
  E: '#be185d',
};

export function generateGrowthHtmlReport(data: GrowthAdvisorData, url: string, generatedAt: string): string {
  const now = new Date(generatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const disclaimerBlock = `
<div class="disclaimer">
  <strong>Disclaimer:</strong> ${DISCLAIMER_TEXT}
</div>`;

  const opportunityCards = [...(data.opportunities || [])]
    .sort((a, b) => a.priority - b.priority)
    .map(opp => {
      const steps = (opp.implementationSteps || []).map((s, i) => `<li><span class="step-num">${i + 1}</span>${s}</li>`).join('');
      const providers = (opp.providers || []).map(p => `
        <div class="provider-card">
          <div class="provider-header">
            <strong>${p.providerName}</strong>
            <span class="badge badge-gray">${p.providerType}</span>
          </div>
          <p>${p.serviceDescription}</p>
          <div class="provider-meta">
            <span><strong>Cost:</strong> ${p.estimatedCost}</span>
            ${p.website ? `<a href="${p.website}" target="_blank" rel="noopener noreferrer">${p.website}</a>` : ''}
            ${p.proximityNote ? `<span>${p.proximityNote}</span>` : ''}
          </div>
        </div>
      `).join('');

      return `
    <div class="opp-card">
      <div class="opp-header">
        <div class="opp-rank">${opp.priority}</div>
        <div class="opp-meta">
          <h4>${opp.opportunityTitle}</h4>
          <div class="badges">
            <span class="badge" style="background:${categoryColor[opp.category]}20;color:${categoryColor[opp.category]};border:1px solid ${categoryColor[opp.category]}40">
              ${opp.category} — ${categoryLabel[opp.category] || opp.category}
            </span>
            <span class="badge" style="background:${effortColor(opp.implementationEffort)}20;color:${effortColor(opp.implementationEffort)};border:1px solid ${effortColor(opp.implementationEffort)}40">
              Effort: ${opp.implementationEffort}
            </span>
          </div>
        </div>
        <div class="opp-revenue">
          <div class="revenue-range">${opp.estimatedMonthlyRevenueImpact}</div>
          <div class="time-to-rev">${opp.timeToRevenue}</div>
        </div>
      </div>
      <p class="opp-desc">${opp.description}</p>
      ${opp.competitorEvidence ? `<div class="evidence-box"><strong>Competitor Evidence:</strong> ${opp.competitorEvidence}</div>` : ''}
      ${opp.trendSignal ? `<div class="trend-box"><strong>Market Trend Signal:</strong> ${opp.trendSignal}</div>` : ''}
      ${steps ? `<div class="steps-section"><div class="steps-label">Implementation Steps</div><ol class="steps">${steps}</ol></div>` : ''}
      ${providers ? `<div class="providers-section"><div class="steps-label">Local Implementation Providers</div>${providers}</div>` : ''}
    </div>`;
    }).join('');

  const competitorCards = (data.competitors || []).map(c => `
    <div class="card">
      <div class="comp-header">
        <div>
          <h3>${c.name}</h3>
          ${c.url ? `<a href="${c.url}" target="_blank" rel="noopener noreferrer">${c.url}</a>` : ''}
          ${c.distance ? `<span class="muted"> · ${c.distance}</span>` : ''}
        </div>
      </div>
      ${c.uniqueProducts?.length ? `<div class="mini-section"><strong>Unique Products:</strong><ul>${c.uniqueProducts.map(p => `<li>${p}</li>`).join('')}</ul></div>` : ''}
      ${c.salesChannels?.length ? `<div class="mini-section"><strong>Sales Channels:</strong> ${c.salesChannels.map(ch => `<span class="tag">${ch}</span>`).join('')}</div>` : ''}
      ${c.strengthsOverTarget?.length ? `<div class="mini-section"><strong>Strengths Over Target:</strong><ul>${c.strengthsOverTarget.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
      ${c.pricingNotes ? `<p class="muted" style="margin-top:8px"><strong>Pricing:</strong> ${c.pricingNotes}</p>` : ''}
      ${c.loyaltyOrPromos ? `<p class="muted"><strong>Loyalty/Promos:</strong> ${c.loyaltyOrPromos}</p>` : ''}
    </div>`).join('');

  const trendCards = (data.trendSignals || []).map(t => `
    <div class="card">
      <div class="card-header">
        <h4>${t.trend}</h4>
        <span class="badge badge-blue">${t.urgency}</span>
      </div>
      <p>${t.relevance}</p>
    </div>`).join('');

  const roadmapMonths = [
    { label: 'Month 1 — Quick Wins', data: data.roadmap?.month1, color: '#16a34a' },
    { label: 'Month 2 — Growth Moves', data: data.roadmap?.month2, color: '#2563eb' },
    { label: 'Month 3 — Strategic Plays', data: data.roadmap?.month3, color: '#7c3aed' },
  ].filter(m => m.data).map(m => `
    <div class="roadmap-month" style="border-top:4px solid ${m.color}">
      <div class="roadmap-label" style="color:${m.color}">${m.label}</div>
      <div class="roadmap-theme">${m.data!.theme}</div>
      ${(m.data!.actions || []).map(a => `
        <div class="roadmap-action">
          <strong>${a.opportunityTitle}</strong>
          <p>${a.firstStep}</p>
        </div>`).join('')}
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.businessName} — Sales Growth Advisor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; color: #1e293b; background: #f8fafc; line-height: 1.6; }
    h1,h2,h3,h4 { font-family: 'Syne', sans-serif; }

    .header { background: linear-gradient(135deg, #064e3b 0%, #0d9488 100%); color: white; padding: 48px; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px; }
    .brand { font-size: 13px; opacity: 0.8; margin-bottom: 8px; font-family: 'Syne', sans-serif; letter-spacing: 0.1em; text-transform: uppercase; }
    .header h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
    .header .subtitle { opacity: 0.8; font-size: 15px; }
    .revenue-box { text-align: right; }
    .revenue-label { font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .revenue-value { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; }
    .revenue-sub { font-size: 12px; opacity: 0.7; margin-top: 2px; }
    .quickwin-banner { margin-top: 24px; background: rgba(255,255,255,0.15); border-radius: 14px; padding: 16px 20px; border: 1px solid rgba(255,255,255,0.2); }
    .quickwin-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.7; margin-bottom: 4px; }

    .meta-bar { background: white; border-bottom: 1px solid #e2e8f0; padding: 12px 24px; font-size: 13px; color: #64748b; display: flex; gap: 24px; flex-wrap: wrap; }

    .container { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
    section { margin-bottom: 48px; }
    section h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }

    .disclaimer { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; font-size: 13px; color: #92400e; line-height: 1.6; margin-bottom: 32px; }

    .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .overview-card { background: white; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; }
    .overview-card h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 12px; }
    .overview-card ul { list-style: none; }
    .overview-card ul li { font-size: 14px; color: #374151; padding: 4px 0; border-bottom: 1px solid #f1f5f9; display: flex; gap: 8px; align-items: flex-start; }
    .overview-card ul li::before { content: '•'; color: #d1d5db; flex-shrink: 0; }

    .roadmap-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .roadmap-month { background: white; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; }
    .roadmap-label { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 2px; }
    .roadmap-theme { font-size: 13px; color: #64748b; margin-bottom: 14px; }
    .roadmap-action { background: #f8fafc; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
    .roadmap-action strong { font-size: 13px; display: block; margin-bottom: 4px; }
    .roadmap-action p { font-size: 12px; color: #64748b; }

    .opp-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 16px; }
    .opp-header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 14px; }
    .opp-rank { width: 36px; height: 36px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; flex-shrink: 0; margin-top: 2px; }
    .opp-meta { flex: 1; min-width: 0; }
    .opp-meta h4 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    .opp-revenue { text-align: right; flex-shrink: 0; }
    .revenue-range { font-weight: 700; color: #16a34a; font-size: 15px; white-space: nowrap; }
    .time-to-rev { font-size: 12px; color: #94a3b8; margin-top: 2px; }
    .opp-desc { color: #475569; font-size: 14px; line-height: 1.7; margin-bottom: 14px; }
    .evidence-box { background: #eff6ff; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #1e40af; margin-bottom: 10px; }
    .trend-box { background: #faf5ff; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #6b21a8; margin-bottom: 10px; }
    .steps-section, .providers-section { background: #f8fafc; border-radius: 10px; padding: 16px; margin-top: 12px; }
    .steps-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 10px; }
    .steps { padding-left: 0; list-style: none; }
    .steps li { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: #475569; padding: 5px 0; }
    .step-num { width: 20px; height: 20px; background: #dbeafe; color: #1d4ed8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .provider-card { background: white; border-radius: 10px; padding: 14px; border: 1px solid #e2e8f0; margin-top: 10px; }
    .provider-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
    .provider-header strong { font-size: 14px; }
    .provider-card p { font-size: 13px; color: #475569; margin-bottom: 6px; }
    .provider-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #64748b; }
    .provider-meta a { color: #2563eb; text-decoration: none; }

    .card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 16px; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
    .card h3 { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
    .card h4 { font-size: 15px; font-weight: 700; }
    .card a { font-size: 13px; color: #2563eb; text-decoration: none; }
    .card p { font-size: 14px; color: #475569; }
    .comp-header { margin-bottom: 14px; }
    .mini-section { margin-top: 12px; font-size: 13px; }
    .mini-section strong { color: #374151; }
    .mini-section ul { padding-left: 16px; margin-top: 4px; }
    .mini-section ul li { color: #475569; padding: 2px 0; }

    .tags-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-gray { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { background: #f1f5f9; color: #475569; font-size: 12px; padding: 3px 10px; border-radius: 999px; display: inline-block; margin: 2px; }
    .muted { color: #94a3b8 !important; font-size: 13px; }

    .footer { text-align: center; padding: 32px; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; margin-top: 48px; }
    .footer strong { color: #1e293b; }

    @media print {
      body { background: white; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .opp-card, .card { break-inside: avoid; }
    }
  </style>
</head>
<body>

<div class="header">
  <div class="header-top">
    <div>
      <div class="brand">SiteAnalyzer Pro · Sales Growth Advisor</div>
      <h1>${data.businessName}</h1>
      <div class="subtitle">${data.businessType} · ${data.location}</div>
    </div>
    <div class="revenue-box">
      <div class="revenue-label">Total Revenue Opportunity</div>
      <div class="revenue-value">${data.totalEstimatedMonthlyRevenueRange}</div>
      <div class="revenue-sub">estimated monthly range</div>
    </div>
  </div>
  ${data.topQuickWin ? `
  <div class="quickwin-banner">
    <div class="quickwin-label">Top Quick Win</div>
    <div>${data.topQuickWin}</div>
  </div>` : ''}
</div>

<div class="meta-bar">
  <span>📅 Generated: ${now}</span>
  <span>🌐 Analyzed: ${url}</span>
  <span>📊 Sales Growth Advisor by SiteAnalyzer Pro</span>
</div>

<div class="container">

  ${disclaimerBlock}

  <section>
    <h2>Business Overview</h2>
    <div class="overview-grid">
      <div class="overview-card">
        <h3>Current Products / Services</h3>
        <ul>${(data.currentProducts || []).map(p => `<li>${p}</li>`).join('')}</ul>
      </div>
      <div class="overview-card">
        <h3>Current Sales Channels</h3>
        <ul>${(data.currentChannels || []).map(c => `<li>${c}</li>`).join('')}</ul>
      </div>
      <div class="overview-card">
        <h3>Current Pricing</h3>
        <p>${data.currentPricing || 'Not available'}</p>
      </div>
    </div>
  </section>

  <section>
    <h2>90-Day Action Roadmap</h2>
    <div class="roadmap-grid">${roadmapMonths}</div>
  </section>

  <section>
    <h2>Growth Opportunities (${(data.opportunities || []).length})</h2>
    ${opportunityCards}
  </section>

  ${(data.competitors || []).length > 0 ? `
  <section>
    <h2>Competitor Intelligence</h2>
    ${competitorCards}
  </section>` : ''}

  ${(data.trendSignals || []).length > 0 ? `
  <section>
    <h2>Market Trend Signals</h2>
    <div class="tags-grid">${trendCards}</div>
  </section>` : ''}

  ${disclaimerBlock}

</div>

<div class="footer">
  <p>Generated by <strong>SiteAnalyzer Pro</strong> · Sales Growth Advisor</p>
  <p style="margin-top:4px">${now} · For informational purposes only</p>
</div>

</body>
</html>`;
}
