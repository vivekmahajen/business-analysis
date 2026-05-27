import Anthropic from '@anthropic-ai/sdk';
import { getCachedScores } from './scoreCache';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(url: string, radius: number): string {
  return `You are an expert business intelligence analyst specializing in competitive analysis and digital marketing strategy.

Analyze this website comprehensively: ${url}
Geographic focus: competitors within ${radius} miles of the business location.

Your task:
1. Crawl and analyze the target website thoroughly — understand their business type, offerings, pricing if visible, location, target market, and digital quality
2. Search for 4–5 real, direct competitors in the same geographic area and industry
3. Analyze each competitor's website in depth:
   - Digital presence, content quality, UX, features, SEO signals, and competitive advantages
   - Specific products and services they offer (especially unique or differentiating ones the target business does NOT offer)
   - Marketing tactics and channels they actively use (loyalty programs, delivery apps, social media platforms, email marketing, promotions, influencer partnerships, events, etc.)
4. Perform a detailed gap analysis — what does each competitor do better? What is the target business missing?
5. Generate prioritized, actionable strategic recommendations to close the identified gaps
6. Identify competitor products, services, and marketing tactics that could realistically be adopted by the target business — evaluate whether each one is a good fit given the target business's type, location, size, and market

Return ONLY a single valid JSON object with no markdown formatting, no preamble, no explanation. Use exactly this structure:

{
  "businessName": "Business name as found on website",
  "businessType": "Industry/business type description",
  "location": "City, State (if identifiable)",
  "executiveSummary": "3–4 sentence strategic overview highlighting key findings, competitive position, and top opportunity",
  "overallScore": 68,
  "marketPosition": "Challenger",
  "competitors": [
    {
      "name": "Real Competitor Business Name",
      "url": "https://their-actual-website.com",
      "score": 82,
      "tags": ["Online Ordering", "Strong SEO", "Mobile App", "Loyalty Program"],
      "description": "2–3 sentence description of their key strengths and why they outperform the target business",
      "products": [
        "Specific product or service they offer — e.g. 'Vegan pizza options', 'Pizza by the slice', 'Catering packages', 'Family meal deals'"
      ],
      "marketingTactics": [
        "Specific marketing tactic — e.g. 'DoorDash and Uber Eats delivery integration', 'Weekly email newsletter with coupons', 'Instagram Reels showcasing daily specials', 'Punch-card loyalty program'"
      ]
    }
  ],
  "strengths": [
    {
      "title": "Strength Area Title",
      "description": "Detailed description with specific evidence from the website — what exactly makes this a strength",
      "score": 80,
      "category": "Digital Presence"
    }
  ],
  "weaknesses": [
    {
      "title": "Weakness Area Title",
      "description": "Specific weakness with evidence — what is missing, broken, or underperforming compared to best practice or competitors",
      "impact": "High",
      "category": "SEO"
    }
  ],
  "gaps": [
    {
      "title": "Gap Title",
      "description": "Exactly what is missing or underperforming compared to competitors — be specific about the capability or feature gap",
      "competitor": "Name of competitor who does this better",
      "priority": "Critical",
      "category": "Technology"
    }
  ],
  "solutions": [
    {
      "title": "Solution/Action Title",
      "description": "Detailed description of what to implement, why it matters, and what outcome to expect",
      "effort": "Medium",
      "impact": "High",
      "timeframe": "Short-term",
      "estimatedCost": "$500–2,000",
      "steps": [
        "Specific actionable step 1",
        "Specific actionable step 2",
        "Specific actionable step 3",
        "Specific actionable step 4"
      ]
    }
  ],
  "competitorOpportunities": [
    {
      "title": "Opportunity Title — e.g. 'Add Pizza by the Slice'",
      "description": "Clear explanation of what this product, service, or tactic is and why it's an opportunity",
      "sourceCompetitor": "Name of the competitor that does this",
      "type": "product",
      "fitAssessment": "2–3 sentences assessing whether this specific opportunity makes sense for THIS business — consider their location, customer base, existing menu/offerings, operational complexity, and market demand signals",
      "fitScore": "Strong Fit",
      "priority": "High",
      "implementationSteps": [
        "Step 1 to adopt this opportunity",
        "Step 2",
        "Step 3"
      ]
    }
  ],
  "seoScore": 58,
  "seoFindings": [
    "Missing meta descriptions on 60%+ of pages",
    "No structured data / schema markup detected",
    "Page load speed above 4 seconds on mobile"
  ],
  "digitalScore": 72,
  "digitalFindings": [
    "Google Business Profile is claimed but incomplete",
    "No presence on Yelp or industry directories"
  ],
  "contentScore": 65,
  "contentFindings": [
    "Homepage copy is generic with no clear value proposition",
    "No blog or educational content for SEO"
  ],
  "uxScore": 70,
  "uxFindings": [
    "Mobile menu is difficult to navigate",
    "No clear call-to-action above the fold"
  ]
}

Validation rules — strictly enforce these:
- impact / priority values: "Critical" | "High" | "Medium" | "Low" only
- effort values: "Low" | "Medium" | "High" only
- timeframe values: "Immediate" | "Short-term" | "Long-term" only
- marketPosition values: "Leader" | "Challenger" | "Follower" | "Nicher" only
- fitScore values: "Strong Fit" | "Good Fit" | "Moderate Fit" | "Poor Fit" only
- type values in competitorOpportunities: "product" | "service" | "marketing" only
- All score fields: integers between 0 and 100 only
- competitors: must be real businesses with real URLs found via web search
- products and marketingTactics: must be specific, concrete items found on or about the competitor — not generic descriptions
- competitorOpportunities: include 4–8 items covering both product/service opportunities and marketing tactic opportunities
- fitAssessment: must be specific to the target business — explain WHY it's a good or poor fit, not just that it "could work"
- findings: must be specific observations, not generic advice
- Return ONLY the JSON object. Nothing before it. Nothing after it.`;
}

export async function generateAnalysis(url: string, radius: number): Promise<Record<string, unknown>> {
  const prompt = buildPrompt(url, radius);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ type: 'web_search_20250305', name: 'web_search' }] as any,
    messages: [{ role: 'user', content: prompt }],
  });

  let analysisJson: Record<string, unknown> | null = null;

  for (const block of response.content) {
    if (block.type === 'text') {
      const match = block.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          analysisJson = JSON.parse(match[0]);
          break;
        } catch {
          // try next block
        }
      }
    }
  }

  if (!analysisJson) {
    throw new Error('Failed to parse analysis response from Claude API');
  }

  // Substitute cached scores for competitors that have been directly analyzed before
  const competitors = analysisJson.competitors as Array<{ url?: string; score: number }> | undefined;
  if (Array.isArray(competitors) && competitors.length > 0) {
    const competitorUrls = competitors.map(c => c.url).filter((u): u is string => !!u);
    if (competitorUrls.length > 0) {
      const cachedScores = await getCachedScores(competitorUrls);
      if (cachedScores.size > 0) {
        const crypto = await import('crypto');
        analysisJson.competitors = competitors.map(c => {
          if (!c.url) return c;
          const hash = crypto.createHash('md5').update(c.url.toLowerCase().trim()).digest('hex');
          const cached = cachedScores.get(hash);
          return cached !== undefined ? { ...c, score: cached } : c;
        });
      }
    }
  }

  return analysisJson;
}
