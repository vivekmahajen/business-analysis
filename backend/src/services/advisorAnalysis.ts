import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an AI Search Visibility Advisor. For a given business/website you (1) diagnose why it is under-represented in AI-generated answers, (2) prescribe prioritized, evidence-based fixes, and (3) quantify the revenue opportunity as an honest, transparent range. You are rigorous and calibrated: you would rather show your math and your assumptions than hand someone a confident number you can't defend.

WHAT YOU'RE OPTIMIZING FOR
"AI search" = generative engines (ChatGPT, Perplexity, Google AI Overviews / AI Mode, Gemini, Claude, Copilot) that answer a question by retrieving a few sources and synthesizing an answer with citations. The unit of success is a CITATION / BRAND MENTION / RECOMMENDATION inside that answer — typically only ~2–7 sources are cited per answer. This is a different game from ranking blue links, though it sits on top of traditional SEO.

INTEGRITY RULES
- Never fabricate the brand's current AI visibility, competitor citations, query volumes, or the business's metrics. Use provided data; otherwise label every figure a benchmark/assumption with its basis.
- Separate MEASURED (from the audit/user data) from ESTIMATED (your modeling). Label both.
- Recommendations are hypotheses with expected effects, not guarantees.

STEP 1 — DIAGNOSE (why is it low in AI answers?)
Work through these causes, grounded in the audit data, and identify which actually apply:
1. Not in the retrievable/authoritative set — weak traditional SEO foundation.
2. Content not extraction-friendly — the answer isn't front-loaded, no clear headings/Q&A structure.
3. Missing structured data — no FAQPage/Article/Organization JSON-LD schema.
4. Weak entity/authority signals — thin brand entity; few third-party mentions.
5. Staleness — outdated content; AI answers favor fresh sources.
6. Missing citation-worthy elements — no quotations, statistics, or cited sources in the content.
7. Under-optimized brand-controllable sources — first-party pages and business listings.
8. Prompt/coverage mismatch — content doesn't map to the sub-queries AI "fans out" from buyer questions.
9. Platform-specific gaps — absent from sources a given engine favors for the vertical.
Rank the causes that actually apply by impact, each with evidence from the audit.

STEP 2 — PRESCRIBE (prioritized fixes)
For each real cause, give a specific fix. State: action, why it works, effort (low/med/high), expected visibility effect (directional), and how to measure it.
Quick wins first: schema, front-loading, listings, statistics/citations/quotations.
Structural later: authority-building, net-new content, PR.

STEP 3 — QUANTIFY THE OPPORTUNITY ($) — DOCTRINE
Produce a dollar opportunity ONLY as a transparent, assumption-driven RANGE with math shown.
- NO single confident number framed as money they "will" earn.
- Frame as: "IF you reach the modeled citation share AND these inputs hold, the modeled annual incremental revenue is $LOW–$HIGH."
- BUILD FROM EXPLICIT INPUTS: Monthly AI query volume, citation share uplift, AI-answer click-through rate, conversion rate, average order value / LTV.
- Formula: query_volume × delta_citation_share × click_through × conversion × value × 12
- Give conservative/expected/optimistic scenarios.
- SEPARATE trackable revenue from zero-click brand influence.
- STATE the dominant sensitivity.
- If key inputs are missing, widen the range and explain in limitations.

CRITICAL: You must respond with ONLY this JSON structure — no prose, no markdown fences, no explanation outside the JSON:

{
  "business": {"name": "", "url": "", "vertical": ""},
  "snapshot": {"engines": [{"engine":"","brand_cited":false,"share_of_voice_pct":null,"top_competitors_cited":[],"how_described":""}], "confidence":"low|moderate|high"},
  "diagnosis": [{"cause":"","applies":true,"evidence":"","impact":"low|medium|high"}],
  "fixes": [{"action":"","lever":"","effort":"low|medium|high","expected_visibility_effect":"directional estimate + basis","measure":"","tier":"quick_win|structural"}],
  "dollar_model": {
    "inputs": [{"name":"","value":null,"source":"user_data|benchmark","note":""}],
    "formula":"query_volume × delta_citation_share × click_through × conversion × value × 12",
    "trackable_annual_revenue": {"conservative":0,"expected":0,"optimistic":0},
    "zero_click_brand_influence":"separate, softer estimate or excluded — unattributable",
    "dominant_sensitivity":"",
    "is_projection_not_guarantee": true
  },
  "limitations": ""
}`;

interface AuditResultWithText {
  provider: string;
  queryCategory: string;
  query: string;
  responseText: string;
  mentioned: boolean;
  mentionRank: number | null;
  mentionContext: string | null;
}

function buildUserMessage(
  businessName: string,
  businessUrl: string | null,
  city: string,
  state: string,
  category: string,
  scoreBreakdown: Record<string, unknown> | null,
  overallScore: number | null,
  results: AuditResultWithText[],
): string {
  const providerStats = scoreBreakdown
    ? Object.entries((scoreBreakdown as { providers?: Record<string, { score: number; mentioned: number; total: number }> }).providers || {})
        .map(([p, d]) => `  - ${p}: ${d.mentioned}/${d.total} queries mentioned (score ${d.score}/100)`)
        .join('\n')
    : '  (no breakdown available)';

  const queryLines = results.map(r => {
    const mentionLine = r.mentioned
      ? `→ MENTIONED${r.mentionRank ? ` at rank #${r.mentionRank}` : ''}`
      : '→ NOT MENTIONED';
    const contextLine = r.mentionContext ? `   Context: "${r.mentionContext}"` : '';
    const responseSample = r.responseText
      ? `   AI answer excerpt: "${r.responseText.slice(0, 300).replace(/\n/g, ' ')}…"`
      : '';
    return [
      `[${r.provider}] ${r.queryCategory}: "${r.query}"`,
      mentionLine,
      contextLine,
      responseSample,
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  // Identify competitors cited when the business was NOT mentioned
  const competitorMentions: string[] = [];
  for (const r of results) {
    if (!r.mentioned && r.responseText) {
      const excerpt = r.responseText.slice(0, 500);
      competitorMentions.push(`[${r.provider}/${r.queryCategory}]: ${excerpt}`);
    }
  }

  const competitorSection = competitorMentions.length > 0
    ? `\nCOMPETITOR CITATIONS (excerpts from answers where the business was NOT mentioned, first 3):\n${competitorMentions.slice(0, 3).join('\n\n')}`
    : '\n(No competitor citation data available)';

  return `BUSINESS AUDIT DATA — please analyze and return the JSON advisor report.

BUSINESS: ${businessName}
URL: ${businessUrl || '(not provided)'}
VERTICAL: ${category}
LOCATION: ${city}, ${state}

AI VISIBILITY AUDIT RESULTS (${results.length} queries across ChatGPT and Perplexity):
Overall AISPS Score: ${overallScore !== null ? `${overallScore}/100` : 'N/A'}
Per-provider breakdown:
${providerStats}

QUERY-BY-QUERY RESULTS:
${queryLines}
${competitorSection}

No additional business metrics (conversion rate, AOV) are available — use clearly labeled benchmarks and widen the ranges accordingly.

Respond ONLY with the JSON object. No markdown, no prose outside the JSON.`;
}

export interface AdvisorReport {
  business: { name: string; url: string; vertical: string };
  snapshot: {
    engines: Array<{
      engine: string;
      brand_cited: boolean;
      share_of_voice_pct: number | null;
      top_competitors_cited: string[];
      how_described: string;
    }>;
    confidence: 'low' | 'moderate' | 'high';
  };
  diagnosis: Array<{ cause: string; applies: boolean; evidence: string; impact: 'low' | 'medium' | 'high' }>;
  fixes: Array<{
    action: string;
    lever: string;
    effort: 'low' | 'medium' | 'high';
    expected_visibility_effect: string;
    measure: string;
    tier: 'quick_win' | 'structural';
  }>;
  dollar_model: {
    inputs: Array<{ name: string; value: number | string | null; source: 'user_data' | 'benchmark'; note: string }>;
    formula: string;
    trackable_annual_revenue: { conservative: number; expected: number; optimistic: number };
    zero_click_brand_influence: string;
    dominant_sensitivity: string;
    is_projection_not_guarantee: true;
  };
  limitations: string;
}

export async function runAdvisorAnalysis(auditId: string): Promise<AdvisorReport> {
  const audit = await prisma.llmAudit.findUnique({
    where: { id: auditId },
    include: { results: { orderBy: { createdAt: 'asc' } } },
  });

  if (!audit) throw new Error('Audit not found');
  if (audit.status !== 'completed') throw new Error('Audit is not completed yet');

  const userMessage = buildUserMessage(
    audit.businessName,
    audit.businessUrl,
    audit.city,
    audit.state,
    audit.category,
    audit.scoreBreakdown as Record<string, unknown> | null,
    audit.overallScore,
    audit.results,
  );

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude');

  let jsonText = textBlock.text.trim();
  // Strip markdown code fences if the model adds them despite instructions
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const report = JSON.parse(jsonText) as AdvisorReport;

  // Cache the report in the DB
  await prisma.llmAudit.update({
    where: { id: auditId },
    data: { advisorReport: report as object },
  });

  return report;
}
