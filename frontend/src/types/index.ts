export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  plan?: string;
  creditsRemaining?: number;
}

export interface Competitor {
  name: string;
  url: string;
  score: number;
  tags: string[];
  description: string;
  products: string[];
  marketingTactics: string[];
}

export interface CompetitorOpportunity {
  title: string;
  description: string;
  sourceCompetitor: string;
  type: 'product' | 'service' | 'marketing';
  fitAssessment: string;
  fitScore: 'Strong Fit' | 'Good Fit' | 'Moderate Fit' | 'Poor Fit';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  implementationSteps: string[];
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
  competitorOpportunities?: CompetitorOpportunity[];
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
  growthPotentialScore?: number;
  growthPotentialLabel?: string;
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

export type Screen = 'landing' | 'auth' | 'dashboard' | 'found' | 'payment' | 'gen' | 'report' | 'admin-leads' | 'pricing' | 'reset-password';
export type AuthMode = 'login' | 'register' | 'forgot';

// Admin Lead Discovery types

export interface LeadCompetitor {
  name: string;
  rating: number;
  reviewCount: number;
  keyAdvantage: string;
}

export interface TeaserFinding {
  code: string;
  title: string;
  finding: string;
}

export interface FullFinding {
  code: string;
  title: string;
  finding: string;
  category: string;
  estimatedImpact: string;
}

export interface TeaserReport {
  emailSubject: string;
  emailSubjectVariant: string;
  openingHook: string;
  ctaHeadline: string;
  ctaBody: string;
  ctaButtonText: string;
  ctaUrl: string;
  footerText: string;
}

export interface AdminLead {
  id: string;
  businessName: string;
  category: string;
  subCategory: string | null;
  rating: number;
  reviewCount: number;
  ratingTrend: 'declining' | 'flat' | 'improving';
  reviewResponseRate: string | null;
  primarySource: string;
  address: string | null;
  city: string;
  state: string;
  zipCode: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  ownerName: string | null;
  contactFound: boolean;
  hasOnlineOrdering: boolean | null;
  hasSocialMedia: boolean | null;
  lastReviewDate: string | null;
  conversionScore: number;
  competitors: LeadCompetitor[] | null;
  teaserFindings: TeaserFinding[] | null;
  fullFindings: FullFinding[] | null;
  teaserReport: TeaserReport | null;
  status: 'discovered' | 'emailed' | 'clicked' | 'signed_up' | 'converted';
  teaserSentAt: string | null;
  teaserClickedAt: string | null;
  convertedAt: string | null;
  discoveredAt: string;
}

// LLM Visibility (AISPS) types

export interface LlmAuditResult {
  id: string;
  provider: string;
  queryCategory: string;
  query: string;
  mentioned: boolean;
  mentionRank: number | null;
  mentionContext: string | null;
}

export interface ScoreBreakdown {
  overallScore: number;
  providers: Record<string, { score: number; mentioned: number; total: number }>;
  interpretation: string;
  label: string;
}

export interface LlmAudit {
  id: string;
  businessName: string;
  businessUrl: string | null;
  city: string;
  state: string;
  category: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  overallScore: number | null;
  scoreBreakdown: ScoreBreakdown | null;
  totalQueries: number;
  mentionCount: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  results: LlmAuditResult[];
}

export interface LlmAuditSummary {
  id: string;
  businessName: string;
  businessUrl: string | null;
  city: string;
  state: string;
  category: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  overallScore: number | null;
  scoreBreakdown: ScoreBreakdown | null;
  totalQueries: number;
  mentionCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface LeadDiscoveryResult {
  cached: boolean;
  totalFound: number;
  leads: AdminLead[];
  queryMeta?: {
    category: string;
    state: string;
    city: string;
    totalFound: number;
    contactFoundCount: number;
    avgRating: number;
    generatedAt: string;
  };
}
