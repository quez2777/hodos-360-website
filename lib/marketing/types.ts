/**
 * Marketing AI Type Definitions
 */

export interface LeadScore {
  contactId: string;
  score: number;
  factors: ScoreFactor[];
  lastUpdated: string;
  confidence: number;
}

export interface ScoreFactor {
  name: string;
  weight: number;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'paid' | 'content';
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: string[];
  budget?: number;
  startDate: string;
  endDate?: string;
  metrics: CampaignMetrics;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  ctr: number; // Click-through rate
  cpc: number; // Cost per click
  cpa: number; // Cost per acquisition
  roi: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria[];
  size: number;
  value: number; // Average customer value
}

export interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}