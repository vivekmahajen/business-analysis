import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(url: string, radius: number): string {
  return `You are an expert business intelligence analyst specializing in competitive analysis and digital marketing strategy.

Analyze this website comprehensively: ${url}
Geographic focus: competitors within ${radius} miles of the business location.

Your task:
1. Crawl and analyze the target website thoroughly — understand their business type, offerings, pricing if visible, location, target market, and digital quality
2. Search for 4–5 real, direct competitors in the same geographic area and industry
3. Analyze each competitor's website: digital presence, content quality, UX, features, SEO signals, and competitive advantages
4. Perform a detailed gap analysis — what does each competitor do better? What is the target business missing?
5. Generate prioritized, actionable strategic recommendations to close the identified gaps

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
      "description": "2–3 sentence description of their key strengths and why they outperform the target business"
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
- All score fields: integers between 0 and 100 only
- competitors: must be real businesses with real URLs found via web search
- findings: must be specific observations, not generic advice
- Return ONLY the JSON object. Nothing before it. Nothing after it.`;
}

export async function generateAnalysis(url: string, radius: number): Promise<Record<string, unknown>> {
  const prompt = buildPrompt(url, radius);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    tools: [
      {
        type: 'web_search_20250305' as const,
        name: 'web_search',
      } as Parameters<typeof client.messages.create>[0]['tools'][0],
    ],
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

  return analysisJson;
}
