import { prisma } from '../lib/prisma';

// ─── Query Library ──────────────────────────────────────────────────────────

interface QueryTemplate {
  category: string;
  template: string;
}

const QUERY_TEMPLATES: QueryTemplate[] = [
  { category: 'best_in_city', template: 'What are the best {category} businesses in {city}, {state}?' },
  { category: 'recommendations', template: 'Can you recommend good {category} options in {city}, {state}?' },
  { category: 'top_rated', template: 'What are the top-rated {category} places near {city}, {state}?' },
  { category: 'where_to_go', template: 'Where should I go for {category} in {city}?' },
  { category: 'local_search', template: "I'm looking for {category} in {city}, {state}. Any suggestions?" },
  { category: 'popular', template: 'List the most popular {category} options in {city}, {state}.' },
  { category: 'quality', template: 'Which {category} businesses in {city}, {state} have the best reputation?' },
  { category: 'visitor', template: "I'm visiting {city}, {state} — what {category} businesses should I check out?" },
  { category: 'comparison', template: 'Compare the best {category} businesses in {city}, {state}.' },
  { category: 'hidden_gems', template: 'What are some highly regarded {category} businesses in {city}, {state}?' },
];

export function buildQueries(
  category: string,
  city: string,
  state: string,
): Array<{ category: string; query: string }> {
  return QUERY_TEMPLATES.map(t => ({
    category: t.category,
    query: t.template
      .replace(/\{category\}/g, category.toLowerCase())
      .replace(/\{city\}/g, city)
      .replace(/\{state\}/g, state),
  }));
}

// ─── Mention Parser ──────────────────────────────────────────────────────────

export function parseMention(
  response: string,
  businessName: string,
): { mentioned: boolean; rank: number | null; context: string | null } {
  const lowerResponse = response.toLowerCase();
  const lowerName = businessName.toLowerCase();

  const directMatch = lowerResponse.includes(lowerName);

  // Fuzzy: check if all significant words in the business name appear nearby
  let fuzzyMatch = false;
  if (!directMatch) {
    const words = lowerName.split(/\s+/).filter(w => w.length > 3);
    if (words.length >= 2) {
      fuzzyMatch = words.every(w => lowerResponse.includes(w));
    }
  }

  if (!directMatch && !fuzzyMatch) {
    return { mentioned: false, rank: null, context: null };
  }

  // Find rank from numbered list (e.g. "1. Business Name" or "1) Business Name")
  let rank: number | null = null;
  const lines = response.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes(lowerName)) {
      const m = line.match(/^\s*(\d+)[.)]\s/);
      if (m) rank = parseInt(m[1], 10);
      break;
    }
  }

  // Extract the sentence containing the business name for context
  const sentences = response.split(/(?<=[.!?])\s+/);
  const contextSentence = sentences.find(s => s.toLowerCase().includes(lowerName));
  const context = contextSentence?.trim().slice(0, 300) || null;

  return { mentioned: true, rank, context };
}

// ─── LLM Callers ────────────────────────────────────────────────────────────

async function callOpenAI(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 600,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content || '';
}

async function callPerplexity(prompt: string): Promise<string> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) throw new Error('PERPLEXITY_API_KEY not set');

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 600,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content || '';
}

// ─── Score Calculator ────────────────────────────────────────────────────────

interface AuditResultInput {
  provider: string;
  mentioned: boolean;
  mentionRank: number | null;
}

export interface ScoreBreakdown {
  overallScore: number;
  providers: Record<string, { score: number; mentioned: number; total: number }>;
  interpretation: string;
  label: string;
}

export function calculateAISPS(results: AuditResultInput[]): ScoreBreakdown {
  const byProvider: Record<string, AuditResultInput[]> = {};
  for (const r of results) {
    if (!byProvider[r.provider]) byProvider[r.provider] = [];
    byProvider[r.provider].push(r);
  }

  const providers: Record<string, { score: number; mentioned: number; total: number }> = {};

  for (const [provider, pResults] of Object.entries(byProvider)) {
    const total = pResults.length;
    const mentioned = pResults.filter(r => r.mentioned).length;
    const mentionRate = total > 0 ? mentioned / total : 0;

    // Top-3 rank bonus (20 points max)
    const topRanked = pResults.filter(r => r.mentionRank !== null && r.mentionRank <= 3).length;
    const rankBonus = total > 0 ? (topRanked / total) * 20 : 0;

    const score = Math.round(Math.min(100, mentionRate * 80 + rankBonus));
    providers[provider] = { score, mentioned, total };
  }

  const scores = Object.values(providers).map(p => p.score);
  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  let label: string;
  let interpretation: string;
  if (overallScore >= 75) {
    label = 'Strong Visibility';
    interpretation = 'Your business appears frequently when customers ask AI assistants for local recommendations.';
  } else if (overallScore >= 50) {
    label = 'Moderate Visibility';
    interpretation = 'Your business appears sometimes in AI recommendations but has significant room for improvement.';
  } else if (overallScore >= 25) {
    label = 'Weak Visibility';
    interpretation = 'Your business rarely appears when customers ask AI assistants for recommendations in your area.';
  } else {
    label = 'Not Visible';
    interpretation = 'Your business is not appearing in AI assistant recommendations. This is a significant opportunity gap.';
  }

  return { overallScore, providers, interpretation, label };
}

// ─── Audit Runner ────────────────────────────────────────────────────────────

const PROVIDERS = [
  { key: 'openai', fn: callOpenAI },
  { key: 'perplexity', fn: callPerplexity },
];

export async function runLlmAudit(auditId: string): Promise<void> {
  const audit = await prisma.llmAudit.findUnique({ where: { id: auditId } });
  if (!audit) return;

  try {
    await prisma.llmAudit.update({ where: { id: auditId }, data: { status: 'running' } });

    const queries = buildQueries(audit.category, audit.city, audit.state);
    const allResults: AuditResultInput[] = [];

    for (const provider of PROVIDERS) {
      for (const { category, query } of queries) {
        let responseText = '';
        try {
          responseText = await provider.fn(query);
        } catch (err) {
          console.error(`[llm-audit] ${provider.key} query failed:`, err);
          responseText = '';
        }

        const { mentioned, rank, context } = parseMention(responseText, audit.businessName);

        await prisma.llmAuditResult.create({
          data: {
            auditId,
            provider: provider.key,
            queryCategory: category,
            query,
            responseText,
            mentioned,
            mentionRank: rank,
            mentionContext: context,
          },
        });

        allResults.push({ provider: provider.key, mentioned, mentionRank: rank });
      }
    }

    const scoreData = calculateAISPS(allResults);
    const mentionCount = allResults.filter(r => r.mentioned).length;

    await prisma.llmAudit.update({
      where: { id: auditId },
      data: {
        status: 'completed',
        overallScore: scoreData.overallScore,
        scoreBreakdown: JSON.parse(JSON.stringify(scoreData)),
        totalQueries: allResults.length,
        mentionCount,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('[llm-audit] Fatal error:', err);
    await prisma.llmAudit.update({
      where: { id: auditId },
      data: {
        status: 'failed',
        errorMessage: (err as Error).message,
      },
    });
  }
}
