import { openAIClient, AIError, countTokens } from './openai-client'
// Temporarily disable pdf-parse import for deployment
// import pdfParse from 'pdf-parse'

// Document processing types
export interface DocumentAnalysis {
  id: string
  fileName: string
  fileType: string
  processedAt: Date
  summary: string
  documentType: DocumentType
  entities: ExtractedEntity[]
  keyInformation: KeyInformation
  risks: RiskAssessment[]
  clauses: ClauseAnalysis[]
  metadata: DocumentMetadata
}

export type DocumentType = 
  | 'contract'
  | 'lease'
  | 'brief'
  | 'motion'
  | 'complaint'
  | 'discovery'
  | 'correspondence'
  | 'other'

export interface ExtractedEntity {
  type: 'person' | 'organization' | 'location' | 'date' | 'monetary' | 'legal_cite'
  text: string
  confidence: number
  context: string
}

export interface KeyInformation {
  parties: string[]
  dates: Array<{ type: string; date: string; description: string }>
  amounts: Array<{ type: string; amount: number; currency: string; description: string }>
  terms: Array<{ term: string; definition: string; importance: 'high' | 'medium' | 'low' }>
}

export interface RiskAssessment {
  type: 'legal' | 'financial' | 'compliance' | 'operational'
  level: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
  references: string[]
}

export interface ClauseAnalysis {
  type: string
  text: string
  significance: 'standard' | 'unusual' | 'concerning' | 'favorable'
  analysis: string
  recommendations: string[]
}

export interface DocumentMetadata {
  wordCount: number
  pageCount: number
  language: string
  readabilityScore: number
  processingTime: number
  tokenUsage: number
}

// Document processor class
export class DocumentProcessor {
  async processDocument(
    buffer: Buffer,
    fileName: string,
    options: {
      extractEntities?: boolean
      analyzeRisks?: boolean
      identifyClauses?: boolean
      generateSummary?: boolean
      maxPages?: number
      language?: string
    } = {}
  ): Promise<DocumentAnalysis> {
    const startTime = Date.now()
    
    try {
      // For deployment, return mock analysis
      const mockAnalysis: DocumentAnalysis = {
        id: `doc_${Date.now()}`,
        fileName,
        fileType: fileName.split('.').pop() || 'unknown',
        processedAt: new Date(),
        summary: 'Document processing temporarily disabled for deployment. This is a mock analysis.',
        documentType: 'other',
        entities: [],
        keyInformation: {
          parties: [],
          dates: [],
          amounts: [],
          terms: []
        },
        risks: [],
        clauses: [],
        metadata: {
          wordCount: 0,
          pageCount: 1,
          language: options.language || 'en',
          readabilityScore: 0,
          processingTime: Date.now() - startTime,
          tokenUsage: 0
        }
      }

      return mockAnalysis
    } catch (error) {
      console.error('Document processing error:', error)
      throw new AIError(
        'Document processing failed',
        'PROCESSING_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  async compareDocuments(
    doc1Buffer: Buffer,
    doc1Name: string,
    doc2Buffer: Buffer,
    doc2Name: string
  ): Promise<any> {
    // Mock comparison for deployment
    return {
      similarity: 0,
      differences: [],
      recommendations: ['Document comparison temporarily disabled for deployment'],
      metadata: {
        processingTime: 0,
        tokenUsage: 0
      }
    }
  }

  async generateDocument(
    templateType: string,
    parameters: Record<string, any>
  ): Promise<any> {
    // Mock generation for deployment
    return {
      content: `Document generation temporarily disabled for deployment. Template: ${templateType}`,
      metadata: {
        templateType,
        generatedAt: new Date().toISOString(),
        parameters,
        tokenUsage: 0
      }
    }
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor()