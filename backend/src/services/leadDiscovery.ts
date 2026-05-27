import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PLATFORM_NAME = process.env.PLATFORM_NAME || 'SiteAnalyzer Pro';
const SIGNUP_URL = process.env.SIGNUP_URL || 'https://siteanalyzer.pro';

export interface LeadDiscoveryParams {
  category: string;
  state: string;
  city: string;
  ratingCeiling?: number;
  minReviews?: number;
  maxResults?: number;
}

function buildLeadDiscoveryPrompt(p: Required<LeadDiscoveryParams>): string {
  return `You are an expert business intelligence analyst and lead generation specialist
working in ADMIN MODE. This function is restricted to admin users only.
Your task is to identify small businesses that have an online presence but are
underperforming on public review platforms (Yelp, Google, TripAdvisor, BBB).
These businesses are struggling and represent ideal candidates for a growth
intelligence platform.

═══════════════════════════════════════════════════════
INPUTS
═══════════════════════════════════════════════════════
CATEGORY: ${p.category}
STATE: ${p.state}
CITY: ${p.city}
RATING_CEILING: ${p.ratingCeiling}
MIN_REVIEWS: ${p.minReviews}
MAX_RESULTS: ${p.maxResults}
PLATFORM_NAME: ${PLATFORM_NAME}
SIGNUP_URL: ${SIGNUP_URL}

═══════════════════════════════════════════════════════
STEP 1 — DISCOVER LOW-RATED BUSINESSES WITH ONLINE PRESENCE
═══════════════════════════════════════════════════════
Search Yelp, Google Business, TripAdvisor, BBB, and Yellow Pages for businesses matching:
  - Category: ${p.category}
  - Location: ${p.city}, ${p.state}
  - Rating: between 1.0 and ${p.ratingCeiling} stars
  - Minimum reviews: ${p.minReviews} (filters sparse, unreliable ratings)
  - Must have: a website URL OR active Google Business profile
    (they are trying to be online but struggling — NOT businesses with zero presence)

For EACH business found, collect:
  a) businessName: exact name as listed
  b) category: one of the 12 standard categories
  c) subCategory: specific type (e.g. "Pizza Restaurant" within Food & Restaurant)
  d) rating: current average star rating (1.0–${p.ratingCeiling})
  e) reviewCount: total public reviews
  f) ratingTrend: analyse last 10 reviews vs overall — "declining", "flat", or "improving"
  g) primarySource: Yelp / Google / TripAdvisor / BBB / Other
  h) address: street address
  i) city: city name
  j) state: two-letter state abbreviation
  k) zipCode: if available
  l) phone: if publicly listed
  m) website: full URL if present
  n) lastReviewDate: date of most recent public review (YYYY-MM-DD)

═══════════════════════════════════════════════════════
STEP 2 — EXTRACT CONTACT INFORMATION
═══════════════════════════════════════════════════════
For each business, attempt to find a direct contact email in this order:
  1. Crawl the business website: /contact page, /about page, mailto: links,
     schema.org email markup, footer email addresses
  2. Google Business contact fields
  3. BBB business listing contact section
  4. Yellow Pages or Foursquare listing
  5. If none found: set email to null, contactFound: false

Also collect where available:
  - ownerName: first and last name of owner if publicly listed
  - hasOnlineOrdering: true/false (relevant for Food & Restaurant)
  - hasSocialMedia: true/false (any active Facebook/Instagram/TikTok found)
  - reviewResponseRate: estimated % of reviews with an owner response

═══════════════════════════════════════════════════════
STEP 3 — COMPETITIVE CONTEXT
═══════════════════════════════════════════════════════
For each business, identify 2–3 direct local competitors in the same city and
sub-category who are OUTPERFORMING them (rating 4.0 or higher). For each competitor:
  - name: business name
  - rating: their star rating
  - reviewCount: their total reviews
  - keyAdvantage: one specific sentence about what they do better

═══════════════════════════════════════════════════════
STEP 4 — TEASER ANALYSIS (3 of 12 findings — shown to business owner)
═══════════════════════════════════════════════════════
Generate exactly 3 TEASER FINDINGS per business for the preview report.
These must be:
  ✓ Genuinely specific to THIS business (use their actual rating, real review text,
    real competitor names, real data points)
  ✓ Impactful enough to make the reader think "I didn't know that" or "that's bad"
  ✓ Framed as a problem or risk, not a solution (solutions are behind the paywall)
  ✓ End with "..." to signal there is more — create a cliff-hanger

Select the 3 most impactful from these finding types:
  T1 — Rating trend (declining momentum is the most alarming)
  T2 — Specific competitor pulling customers away (name them)
  T3 — Missing sales channel (delivery app, online ordering, catering)
  T4 — Review response rate vs local market average
  T5 — Unanswered negative reviews containing a repeated pain point
  T6 — Website quality gap (missing pages, no online ordering, no menu)
  T7 — Social media silence vs competitor activity
  T8 — Off-peak opportunity competitors are capturing

ALSO generate 9 FULL FINDINGS stored in the database but NOT shown in the teaser.
These are the conversion hook. Label them F4 through F12.

═══════════════════════════════════════════════════════
STEP 5 — TEASER REPORT COPY
═══════════════════════════════════════════════════════
For each business, generate the following teaser report components:

EMAIL SUBJECT LINE:
  "[businessName] — we found 3 things hurting your rating in ${p.city}"
  Variant: "Why [businessName] is losing customers to [top competitor name]"

OPENING HOOK (2 personalised sentences):
  "[businessName] has [reviewCount] reviews averaging [rating] stars on [primarySource].
   In ${p.city}'s ${p.category} market, that puts you behind [N] competitors — including
   [top competitor name] ([their rating] ★) who just passed you in [primarySource]
   search results."

TEASER FINDINGS SECTION:
  Show exactly 3 findings from Step 4.

CALL TO ACTION BLOCK:
  Headline: "Get your complete competitive analysis"
  Body: "See all 12 findings, your personalised 90-day growth roadmap, and the
         exact steps your top competitors are using to outrank you."
  Button text: "Get your full report — $99 →"
  Button URL: ${SIGNUP_URL}?ref=[businessId]&src=teaser&city=${p.city}&cat=${p.category}

FOOTER:
  "Generated by ${PLATFORM_NAME} · Based on publicly available review data ·
   To unsubscribe, reply STOP or click here."

═══════════════════════════════════════════════════════
STEP 6 — PRIORITISE BY CONVERSION POTENTIAL
═══════════════════════════════════════════════════════
Score each business for conversion likelihood (1–10) based on:
  - Lower rating = higher urgency (+3 for ≤2.5 stars)
  - Email found = reachable (+2)
  - Rating is declining (+2)
  - Has a website (+1)
  - Has social media (+1)
  - High review count (+1 if >50 reviews)

Sort the output list by conversionScore descending.

═══════════════════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON ONLY
═══════════════════════════════════════════════════════
Return ONLY a valid JSON object. No markdown. No preamble. Start with { end with }.

{
  "queryMeta": {
    "category": "string",
    "state": "string",
    "city": "string",
    "ratingCeiling": 3.5,
    "minReviews": 3,
    "maxResults": 50,
    "totalFound": 0,
    "contactFoundCount": 0,
    "avgRating": 0.0,
    "generatedAt": "ISO date string"
  },
  "businesses": [
    {
      "id": "biz_001",
      "businessName": "string",
      "category": "string",
      "subCategory": "string",
      "rating": 2.8,
      "reviewCount": 47,
      "ratingTrend": "declining",
      "reviewResponseRate": "0%",
      "primarySource": "Yelp",
      "address": "string",
      "city": "string",
      "state": "CA",
      "zipCode": "string or null",
      "phone": "string or null",
      "website": "https://... or null",
      "email": "owner@business.com or null",
      "ownerName": "string or null",
      "contactFound": true,
      "hasOnlineOrdering": false,
      "hasSocialMedia": true,
      "lastReviewDate": "YYYY-MM-DD",
      "conversionScore": 8,
      "competitors": [
        {
          "name": "string",
          "rating": 4.3,
          "reviewCount": 210,
          "keyAdvantage": "string — specific one-sentence advantage"
        }
      ],
      "teaserFindings": [
        {
          "code": "T1",
          "title": "string — short finding title",
          "finding": "string — specific, personalised, ends with ..."
        }
      ],
      "fullFindings": [
        {
          "code": "F4",
          "title": "string",
          "finding": "string — full detailed finding with recommendation",
          "category": "Revenue",
          "estimatedImpact": "$X,000/mo"
        }
      ],
      "teaserReport": {
        "emailSubject": "string",
        "emailSubjectVariant": "string",
        "openingHook": "string",
        "ctaHeadline": "Get your complete competitive analysis",
        "ctaBody": "string",
        "ctaButtonText": "Get your full report — $99 →",
        "ctaUrl": "string — full URL with params",
        "footerText": "string"
      },
      "teaserFindingsShown": 3,
      "fullFindingsCount": 12
    }
  ]
}`;
}

export async function runLeadDiscovery(params: LeadDiscoveryParams): Promise<Record<string, unknown>> {
  const fullParams: Required<LeadDiscoveryParams> = {
    category: params.category,
    state: params.state,
    city: params.city,
    ratingCeiling: params.ratingCeiling ?? 3.5,
    minReviews: params.minReviews ?? 3,
    maxResults: params.maxResults ?? 50,
  };

  const prompt = buildLeadDiscoveryPrompt(fullParams);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 12000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any,
    messages: [{ role: 'user', content: prompt }],
  });

  console.log('[leads] stop_reason:', response.stop_reason, 'blocks:', response.content.length);

  let result: Record<string, unknown> | null = null;
  for (const block of response.content) {
    if (block.type === 'text') {
      console.log('[leads] text block length:', block.text.length);
      const match = block.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          result = JSON.parse(match[0]);
          break;
        } catch (parseErr) {
          console.error('[leads] JSON parse failed, preview:', match[0].slice(0, 500));
        }
      }
    }
  }

  if (!result) {
    return {
      queryMeta: {
        category: fullParams.category,
        state: fullParams.state,
        city: fullParams.city,
        ratingCeiling: fullParams.ratingCeiling,
        minReviews: fullParams.minReviews,
        maxResults: fullParams.maxResults,
        totalFound: 0,
        contactFoundCount: 0,
        avgRating: 0,
        generatedAt: new Date().toISOString(),
      },
      businesses: [],
    };
  }

  return result;
}
