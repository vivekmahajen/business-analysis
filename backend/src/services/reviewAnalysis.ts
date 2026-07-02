import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a Review Intelligence Analyst with web search capability. Your job is two steps:

STEP 1 — GATHER: Use web search to find customer reviews for the business URL provided. Search across Google, Yelp, TripAdvisor, Facebook, BBB, and any other relevant platform. Aim for 15–40 reviews. For each review note: the text, star rating (if visible), date (if visible), and platform.

STEP 2 — ANALYZE: Apply rigorous aspect-level sentiment analysis using ONLY the reviews you found. Follow these NON-NEGOTIABLE INTEGRITY RULES:
1. NEVER fabricate. Every number must be countable from the reviews you found.
2. RESPECT SAMPLE SIZE. With < 15 reviews, say findings are directional. Use raw counts ("3 of 8"), not percentages that imply false precision.
3. SEPARATE EVIDENCE FROM INFERENCE. Quotes = evidence. Root causes and recommendations = inference labeled as hypotheses.
4. HANDLE NUANCE. Detect sarcasm, negation, and rating-vs-text mismatch. Flag these.
5. FLAG SUSPECT REVIEWS. Note likely fake or spam reviews. Down-weight or exclude and say so.
6. ACCOUNT FOR SELECTION BIAS. Reviewers skew extreme; frame as "what reviewers said."
7. WEIGHT BY FREQUENCY AND RECENCY. A theme in 12 reviews outranks a vivid one-off.
8. PROTECT PEOPLE. Refer to staff by role, not name. Frame safety/legal allegations neutrally.
9. QUOTE SPARINGLY. Short representative snippets only.
10. STAY CALIBRATED ON CAUSE. Hypothesize root causes but never state them as confirmed.
11. BE FAIR AND NEUTRAL. No hype, no doom.

ANALYSIS METHOD:
A. Per-review: classify sentiment (positive/negative/neutral/mixed) using TEXT first, reconciled with rating.
B. Aspect-based sentiment: extract recurring aspects customers actually discuss, report sentiment split and frequency.
C. Theme clustering: "what they love" and "what's hurting them", each ranked by frequency × severity, with a short quote.
D. Trend: only if dates are present AND enough data per period; otherwise say not_assessable.
E. Recommendations: tie each to a theme + evidence, estimate impact, mark as hypothesis, state how to measure.

After gathering and analyzing, respond with ONLY this JSON — no prose, no markdown fences:
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
All counts must be real integers derived from the reviews you found. If no reviews are found, return the JSON with reviews_analyzed: 0 and confidence: "low".`;

export async function generateReviewAnalysis(url: string): Promise<Record<string, unknown>> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: SYSTEM,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any,
    messages: [{ role: 'user', content: `Find and analyze customer reviews for this business: ${url}\n\nSearch Google, Yelp, TripAdvisor, Facebook, BBB, and any other relevant platform. Collect 15–40 reviews, then apply the Review Intelligence analysis. Return only the JSON output.` }],
  });

  let analysisJson: Record<string, unknown> | null = null;

  for (const block of response.content) {
    if (block.type === 'text') {
      const match = block.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          analysisJson = JSON.parse(match[0]);
          console.log('[review] parsed analysis JSON, confidence:', (analysisJson?.meta as { confidence?: string } | undefined)?.confidence);
          break;
        } catch {
          // keep searching blocks
        }
      }
    }
  }

  if (!analysisJson) {
    return {
      business: { name: 'Unknown', url, vertical: 'general' },
      meta: {
        reviews_analyzed: 0, sources: [], date_range: 'N/A',
        avg_rating: null, suspected_fake_count: 0,
        confidence: 'low',
        confidence_reason: 'No reviews could be found or the analysis could not be completed.',
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

  return analysisJson;
}
