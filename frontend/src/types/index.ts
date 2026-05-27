export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Competitor {
  name: string;
  url: string;
  score: number;
  tags: string[];
  description: string;
}

export interface Strength {
  title: string;
  description: string;
  score: number;
  category: string;
}

export interface Weakness {
  title: string;
  description: string;
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
}

export interface Gap {
  title: string;
  description: string;
  competitor: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
}

export interface Solution {
  title: string;
  description: string;
  effort: 'Low' | 'Medium' | 'High';
  impact: 'High' | 'Medium' | 'Low';
  timeframe: 'Immediate' | 'Short-term' | 'Long-term';
  estimatedCost: string;
  steps: string[];
}

export interface AnalysisData {
  businessName: string;
  businessType: string;
  location: string;
  executiveSummary: string;
  overallScore: number;
  marketPosition: 'Leader' | 'Challenger' | 'Follower' | 'Nicher';
  competitors: Competitor[];
  strengths: Strength[];
  weaknesses: Weakness[];
  gaps: Gap[];
  solutions: Solution[];
  seoScore: number;
  seoFindings: string[];
  digitalScore: number;
  digitalFindings: string[];
  contentScore: number;
  contentFindings: string[];
  uxScore: number;
  uxFindings: string[];
}

export interface AnalysisEntry {
  id: string;
  url: string;
  radius: number;
  at: string;
  data: AnalysisData;
  reportType?: 'competitive' | 'growth';
  city?: string;
  state?: string;
}

// Growth Advisor types

export interface GrowthCompetitor {
  name: string;
  url: string;
  distance: string;
  strengthsOverTarget: string[];
  uniqueProducts: string[];
  salesChannels: string[];
  pricingNotes: string;
  loyaltyOrPromos: string;
}

export interface TrendSignal {
  trend: string;
  relevance: string;
  urgency: 'Immediate' | 'Seasonal' | 'Ongoing';
}

export interface GrowthProvider {
  providerName: string;
  providerType: string;
  serviceDescription: string;
  estimatedCost: string;
  website: string;
  proximityNote: string;
}

export interface GrowthOpportunity {
  priority: number;
  opportunityTitle: string;
  category: 'A' | 'B' | 'C' | 'D' | 'E';
  description: string;
  competitorEvidence: string;
  trendSignal: string;
  estimatedMonthlyRevenueImpact: string;
  implementationEffort: 'Low' | 'Medium' | 'High';
  timeToRevenue: string;
  implementationSteps: string[];
  providers: GrowthProvider[];
}

export interface RoadmapAction {
  opportunityTitle: string;
  firstStep: string;
}

export interface RoadmapMonth {
  theme: string;
  actions: RoadmapAction[];
}

export interface GrowthAdvisorData {
  businessName: string;
  businessType: string;
  location: string;
  currentProducts: string[];
  currentChannels: string[];
  currentPricing: string;
  competitors: GrowthCompetitor[];
  trendSignals: TrendSignal[];
  opportunities: GrowthOpportunity[];
  roadmap: {
    month1: RoadmapMonth;
    month2: RoadmapMonth;
    month3: RoadmapMonth;
  };
  totalEstimatedMonthlyRevenueRange: string;
  topQuickWin: string;
}

export type Screen = 'landing' | 'auth' | 'dashboard' | 'found' | 'payment' | 'gen' | 'report';
export type AuthMode = 'login' | 'register';
