import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildGrowthPrompt(url: string, radius: number, city: string, state: string): string {
  return `You are a senior business growth strategist and market intelligence analyst.

Your task is to analyze a business and generate a comprehensive, prioritized set of revenue growth opportunities — including new products/services, pricing strategies, sales channel expansions, and competitor-inspired tactics.

TARGET BUSINESS URL: ${url}
BUSINESS LOCATION: ${city}, ${state}
COMPETITOR SEARCH RADIUS: ${radius} miles
FOCUS AREA: all

═══════════════════════════════════════════════
STEP 1 — ANALYZE THE TARGET BUSINESS
═══════════════════════════════════════════════

Crawl and analyze ${url}. Extract:
- Business name, type, and industry
- Current products/services and pricing (exact if visible)
- Current sales channels (dine-in, delivery, online ordering, catering, etc.)
- Any visible promotions, loyalty programs, or bundles
- Location and any mentioned delivery zones
- Estimated customer segments served

═══════════════════════════════════════════════
STEP 2 — COMPETITOR INTELLIGENCE SCAN
═══════════════════════════════════════════════

Search the web for 4–5 DIRECT competitors within ${radius} miles of ${city}.
For EACH competitor, analyze and document:

a) PRODUCT/MENU BREADTH - What do they sell that the target business does NOT? Any specialty, niche, or trending items? Bundle deals, combo meals, or package pricing?
b) PRICING STRATEGY - Price-per-unit vs. value bundles, happy hour, limited-time, or dynamic pricing, tiered pricing
c) SALES CHANNELS IN USE - Third-party delivery apps, online ordering, catering program, subscription boxes, ghost kitchen, wholesale
d) MARKETING & LOYALTY TACTICS - Loyalty/rewards programs, email/SMS marketing, social media, community sponsorships
e) REVENUE-GENERATING TACTICS NOT SEEN ON TARGET SITE

═══════════════════════════════════════════════
STEP 3 — MARKET TREND SIGNALS
═══════════════════════════════════════════════

Search for in ${city} and ${state}:
- Current trending categories in this industry
- Consumer demand shifts in the past 12 months
- Underserved customer segments
- Seasonal or event-based revenue opportunities specific to this city
- Local regulations, events, or demographics that create opportunity

═══════════════════════════════════════════════
STEP 4 — GENERATE RANKED GROWTH OPPORTUNITIES
═══════════════════════════════════════════════

Generate 6–8 specific, actionable revenue growth opportunities covering ALL five categories:

CATEGORY A — PRODUCT / MENU EXPANSION: New products inspired by competitors and market trends. Be specific (not "add vegan options" — instead "add a build-your-own vegan pizza with cauliflower crust, currently offered by [Competitor X] at $16.99, trending +42% in ${city} searches this year").
CATEGORY B — PRICING & BUNDLING TACTICS: New pricing structures, bundles, limited-time offers that competitors use successfully.
CATEGORY C — NEW SALES CHANNELS: Specific delivery apps, catering programs, wholesale channels, subscription models not currently in use.
CATEGORY D — MARKETING & AUDIENCE EXPANSION: New customer segments, partnerships, sponsorships, or promotional tactics.
CATEGORY E — OPERATIONAL REVENUE LEVERS: Upsell systems, POS prompts, extended hours, staff training.

For EACH opportunity: opportunityTitle, category, description, competitorEvidence, trendSignal, estimatedMonthlyRevenueImpact, implementationEffort (Low/Medium/High), timeToRevenue, implementationSteps (4 steps), priority (1–12).

═══════════════════════════════════════════════
STEP 5 — LOCAL IMPLEMENTATION PROVIDERS
═══════════════════════════════════════════════

For the TOP 3 ranked opportunities, search for real local providers, platforms, or vendors in ${city} that can implement each change. For each: providerName, providerType, serviceDescription, estimatedCost, website, proximityNote.

═══════════════════════════════════════════════
STEP 6 — 90-DAY ACTION ROADMAP
═══════════════════════════════════════════════

Organize top 8 opportunities into phased 90-day plan:
MONTH 1 — Quick wins (2–3 opportunities, Low effort, Immediate revenue)
MONTH 2 — Growth moves (2–3 opportunities, Medium effort, Short-term revenue)
MONTH 3 — Strategic plays (2 opportunities, Higher effort, highest long-term value)

Return ONLY valid JSON. No markdown. No preamble. Start with { end with }.

Return ONLY a single valid JSON object with this structure:
{
  "businessName": "string",
  "businessType": "string",
  "location": "City, State",
  "currentProducts": ["string"],
  "currentChannels": ["string"],
  "currentPricing": "string",
  "competitors": [{ "name": "string", "url": "string", "distance": "string", "strengthsOverTarget": ["string"], "uniqueProducts": ["string"], "salesChannels": ["string"], "pricingNotes": "string", "loyaltyOrPromos": "string" }],
  "trendSignals": [{ "trend": "string", "relevance": "string", "urgency": "Immediate | Seasonal | Ongoing" }],
  "opportunities": [{
    "priority": 1,
    "opportunityTitle": "string",
    "category": "A | B | C | D | E",
    "description": "string",
    "competitorEvidence": "string",
    "trendSignal": "string",
    "estimatedMonthlyRevenueImpact": "$X,000 – $Y,000/mo",
    "implementationEffort": "Low | Medium | High",
    "timeToRevenue": "string",
    "implementationSteps": ["string", "string", "string", "string"],
    "providers": [{ "providerName": "string", "providerType": "string", "serviceDescription": "string", "estimatedCost": "string", "website": "string", "proximityNote": "string" }]
  }],
  "roadmap": {
    "month1": { "theme": "Quick wins", "actions": [{ "opportunityTitle": "string", "firstStep": "string" }] },
    "month2": { "theme": "Growth moves", "actions": [{ "opportunityTitle": "string", "firstStep": "string" }] },
    "month3": { "theme": "Strategic plays", "actions": [{ "opportunityTitle": "string", "firstStep": "string" }] }
  },
  "totalEstimatedMonthlyRevenueRange": "$X,000 – $Y,000/mo (just the dollar range, no extra text)",
  "topQuickWin": "string"
}`;
}

export async function generateGrowthAnalysis(
  url: string,
  radius: number,
  city: string,
  state: string,
): Promise<Record<string, unknown>> {
  const prompt = buildGrowthPrompt(url, radius, city, state);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any,
    messages: [{ role: 'user', content: prompt }],
  });

  console.log('[growth] stop_reason:', response.stop_reason, 'blocks:', response.content.length);

  let result: Record<string, unknown> | null = null;
  for (const block of response.content) {
    if (block.type === 'text') {
      console.log('[growth] text block length:', block.text.length);
      const match = block.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          result = JSON.parse(match[0]);
          break;
        } catch (parseErr) {
          console.error('[growth] JSON parse failed, first 500 chars:', match[0].slice(0, 500));
          console.error('[growth] last 200 chars:', match[0].slice(-200));
        }
      } else {
        console.error('[growth] no JSON object found in text block, preview:', block.text.slice(0, 300));
      }
    }
  }

  if (!result) throw new Error('Failed to parse growth analysis response');
  return result;
}
