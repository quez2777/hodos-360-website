/**
 * Content Management Type Definitions
 */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  publishDate: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  featuredImage?: string;
  readingTime: number;
}

export interface Newsletter {
  id: string;
  subject: string;
  content: string;
  templateId: string;
  audienceSegments: string[];
  scheduledDate?: string;
  status: 'draft' | 'scheduled' | 'sent';
  metrics?: NewsletterMetrics;
}

export interface NewsletterMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
}

export interface ContentTemplate {
  id: string;
  name: string;
  type: 'blog' | 'newsletter' | 'social' | 'legal';
  category: string;
  template: string;
  variables: TemplateVariable[];
  isActive: boolean;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

export interface SocialPost {
  id: string;
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram';
  content: string;
  media?: string[];
  scheduledDate?: string;
  status: 'draft' | 'scheduled' | 'published';
  hashtags: string[];
}

export interface SEOAnalysis {
  url: string;
  title: string;
  description: string;
  keywords: string[];
  score: number;
  recommendations: SEORecommendation[];
  lastAnalyzed: string;
}

export interface SEORecommendation {
  type: 'critical' | 'warning' | 'suggestion';
  message: string;
  impact: 'high' | 'medium' | 'low';
}