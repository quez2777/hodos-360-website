/**
 * GoHighLevel Type Definitions
 */

export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  source?: string;
  dateAdded?: string;
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: GHLStage[];
}

export interface GHLStage {
  id: string;
  name: string;
  position: number;
}

export interface GHLOpportunity {
  id: string;
  contactId: string;
  pipelineId: string;
  stageId: string;
  name: string;
  monetaryValue?: number;
  status: 'open' | 'won' | 'lost' | 'abandoned';
}

export interface GHLWebhookEvent {
  type: string;
  contactId?: string;
  opportunityId?: string;
  data: Record<string, any>;
  timestamp: string;
}