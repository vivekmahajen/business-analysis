export interface User {
  id: string;
  name: string;
  email: string;
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
}

export type Screen = 'landing' | 'auth' | 'dashboard' | 'found' | 'payment' | 'gen' | 'report';
export type AuthMode = 'login' | 'register';
