import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const REVIEW_ANALYST_SYSTEM = `You are a Review Intelligence Analyst. You analyze real customer reviews for a business and turn them into (1) rigorous, aspect-level sentiment, and (2) prioritized, evidence-linked recommendations the operator can act on. You are precise, calibrated, and honest — a good analyst who says "the data doesn't support that" rather than inventing a story.

NON-NEGOTIABLE INTEGRITY RULES:
1. NEVER fabricate. Every number must be countable from the provided reviews. If you estimate, label it.
2. RESPECT SAMPLE SIZE. State how many reviews you analyzed. With < 15 reviews, say findings are directional. Use raw counts ("3 of 8"), not percentages that imply false precision.
3. SEPARATE EVIDENCE FROM INFERENCE. Quotes = evidence. Root causes and recommendations = inference labeled as hypotheses.
4. HANDLE NUANCE. Detect sarcasm, negation, and rating-vs-text mismatch. Flag these; don't take star ratings at face value.
5. FLAG SUSPECT REVIEWS. Note likely fake, spam, or competitor-planted reviews. Down-weight or exclude and say so.
6. ACCOUNT FOR SELECTION BIAS. Reviewers skew extreme; the silent middle is absent. Frame as "what reviewers said."
7. WEIGHT BY FREQUENCY AND RECENCY. A theme in 12 reviews outranks a vivid one-off. Note resolved vs emerging issues.
8. PROTECT PEOPLE. Refer to staff by role, not name. Frame safety/legal allegations neutrally as themes to investigate.
9. QUOTE SPARINGLY. Short representative snippets only. Paraphrase long text.
10. STAY CALIBRATED ON CAUSE. You can hypothesize root causes but never state them as confirmed.
11. BE FAIR AND NEUTRAL. No hype, no doom. Surface serious themes soberly; recommend verification, not panic.

METHOD:
A. Per-review: classify sentiment (positive/negative/neutral/mixed) using TEXT first, reconciled with rating.
B. Aspect-based sentiment: extract recurring aspects customers actually discuss, report sentiment split and frequency.
C. Theme clustering: "what they love" and "what's hurting them", each ranked by frequency × severity, with a short quote.
D. Trend: only if dates are present AND enough data per period; otherwise say not assessable.
E. Recommendations: tie each to a theme + evidence, estimate impact, mark as hypothesis, state how to measure success.

Respond with ONLY this JSON — no prose, no markdown fences:
{
  "business": {"name": "", "url": "", "vertical": ""},
  "meta": {"reviews_analyzed": 0, "sources": [], "date_range": "", "avg_rating": null, "suspected_fake_count": 0, "confidence": "low|moderate|high", "confidence_reason": ""},
  "overall_sentiment": {"positive": 0, "neutral": 0, "negative": 0, "mixed": 0},
  "aspects": [{"aspect": "", "positive": 0, "neutral": 0, "negative": 0, "frequency": 0, "example": "", "note": ""}],
  "loves": [{"theme": "", "frequency": 0, "example": ""}],
  "pain_points": [{"theme": "", "frequency": 0, "severity": "low|medium|high", "safety_flag": false, "example": ""}],
  "signals": {"rating_text_mismatches": 0, "suspected_fake": [], "emerging": [], "resolved": [], "trend": "improving|declining|stable|not_assessable"},
  "recommendations": [{"theme": "", "action": "", "type": "quick_win|structural", "expected_impact": "", "impact_is_hypothesis": true, "how_to_measure": ""}],
  "limitations": ""
}
All counts must be real integers derived from the provided reviews.`;

async function gatherReviews(url: string): Promise<{ businessName: string; vertical: string; reviewsText: string; sourceList: string[] }> {
  const gatherPrompt = `Search for customer reviews for this business: ${url}

Search across Google, Yelp, TripAdvisor, Facebook, BBB, and any other relevant platform.
Find as many reviews as possible — ideally 15–40 reviews.

For each review extract:
- Review text (the actual words the customer wrote)
- Star rating (1–5) if visible
- Date if visible
- Platform source (Google, Yelp, etc.)

Also identify the business name and industry/vertical.

Return ONLY this JSON:
{
  "businessName": "Actual Business Name",
  "vertical": "e.g. restaurant, dental, salon, auto repair, etc.",
  "sources": ["Google", "Yelp"],
  "reviews": [
    {"text": "...", "rating": 4, "date": "2024-11-15", "source": "Google"},
    {"text": "...", "rating": 2, "date": null, "source": "Yelp"}
  ]
}

If no reviews are found for this URL, return:
{"businessName": "Unknown", "vertical": "unknown", "sources": [], "reviews": []}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any,
    messages: [{ role: 'user', content: gatherPrompt }],
  });

  let gathered: { businessName: string; vertical: string; sources: string[]; reviews: Array<{ text: string; rating?: number | null; date?: string | null; source?: string }> } | null = null;

  for (const block of response.content) {
    if (block.type === 'text') {
      const match = block.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          gathered = JSON.parse(match[0]);
          break;
        } catch {
          // keep searching blocks
        }
      }
    }
  }

  if (!gathered || !Array.isArray(gathered.reviews)) {
    return { businessName: 'Unknown', vertical: 'general', reviewsText: '', sourceList: [] };
  }

  const reviewsText = gathered.reviews
    .map((r, i) => {
      const parts = [`Review ${i + 1}:`];
      if (r.source) parts.push(`[${r.source}]`);
      if (r.rating != null) parts.push(`[${r.rating}/5 stars]`);
      if (r.date) parts.push(`[${r.date}]`);
      parts.push(`\n${r.text}`);
      return parts.join(' ');
    })
    .join('\n\n---\n\n');

  console.log(`[review] gathered ${gathered.reviews.length} reviews from ${(gathered.sources || []).join(', ')}`);

  return {
    businessName: gathered.businessName || 'Unknown',
    vertical: gathered.vertical || 'general',
    reviewsText,
    sourceList: gathered.sources || [],
  };
}

export async function generateReviewAnalysis(url: string): Promise<Record<string, unknown>> {
  // Phase 1: gather reviews from the web
  const { businessName, vertical, reviewsText, sourceList } = await gatherReviews(url);

  if (!reviewsText) {
    // Return minimal analysis indicating no reviews found
    return {
      business: { name: businessName, url, vertical },
      meta: {
        reviews_analyzed: 0, sources: sourceList, date_range: 'N/A',
        avg_rating: null, suspected_fake_count: 0,
        confidence: 'low', confidence_reason: 'No reviews could be found for this URL.',
      },
      overall_sentiment: { positive: 0, neutral: 0, negative: 0, mixed: 0 },
      aspects: [],
      loves: [],
      pain_points: [],
      signals: { rating_text_mismatches: 0, suspected_fake: [], emerging: [], resolved: [], trend: 'not_assessable' },
      recommendations: [],
      limitations: 'No reviews were found for this business URL. Verify the URL is correct and that the business has public reviews on Google, Yelp, or similar platforms.',
    };
  }

  // Phase 2: run Review Intelligence analysis
  const userMessage = `Business: ${businessName}
URL: ${url}
Vertical: ${vertical}

REVIEWS:

${reviewsText}

Respond in JSON only, no preamble or markdown.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: REVIEW_ANALYST_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });

  let analysisJson: Record<string, unknown> | null = null;

  for (const block of response.content) {
    if (block.type === 'text') {
      const match = block.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          analysisJson = JSON.parse(match[0]);
          console.log('[review] parsed analysis JSON, confidence:', (analysisJson?.meta as any)?.confidence);
          break;
        } catch {
          // keep searching
        }
      }
    }
  }

  if (!analysisJson) {
    throw new Error('Failed to parse review analysis response from Claude API');
  }

  return analysisJson;
}
