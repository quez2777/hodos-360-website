import { openAIClient, AIError, countTokens } from './openai-client'
import type { OpenAI } from './openai-client'
import pdfParse from 'pdf-parse'

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
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'legal_term'
  value: string
  context: string
  confidence: number
}

export interface KeyInformation {
  parties: string[]
  dates: {
    execution?: string
    effective?: string
    expiration?: string
    filing?: string
  }
  amounts: {
    total?: number
    currency?: string
    payment_terms?: string
  }
  jurisdiction?: string
  governing_law?: string
  case_number?: string
}

export interface RiskAssessment {
  type: string
  severity: 'high' | 'medium' | 'low'
  description: string
  recommendation: string
  location: string
}

export interface ClauseAnalysis {
  type: string
  title: string
  content: string
  isStandard: boolean
  concerns: string[]
  suggestions: string[]
}

export interface DocumentMetadata {
  pageCount: number
  wordCount: number
  language: string
  readabilityScore: number
  processingTime: number
}

// Document processing configuration
export interface ProcessingOptions {
  extractEntities?: boolean
  analyzeRisks?: boolean
  identifyClauses?: boolean
  generateSummary?: boolean
  maxPages?: number
  language?: string
}

// Main document processor class
export class DocumentProcessor {
  private static async extractTextFromFile(
    file: Buffer,
    fileName: string
  ): Promise<{ text: string; pageCount: number }> {
    const fileType = fileName.split('.').pop()?.toLowerCase()

    switch (fileType) {
      case 'pdf':
        return await this.extractFromPDF(file)
      case 'txt':
        return {
          text: file.toString('utf-8'),
          pageCount: 1,
        }
      case 'docx':
        // In production, use a library like mammoth or docx
        throw new AIError(
          'DOCX processing not yet implemented',
          'UNSUPPORTED_FORMAT',
          400
        )
      default:
        throw new AIError(
          `Unsupported file type: ${fileType}`,
          'UNSUPPORTED_FORMAT',
          400
        )
    }
  }

  private static async extractFromPDF(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
    try {
      const data = await pdfParse(buffer)
      return {
        text: data.text,
        pageCount: data.numpages,
      }
    } catch (error) {
      throw new AIError(
        'Failed to parse PDF',
        'PDF_PARSE_ERROR',
        500,
        { error }
      )
    }
  }

  private static async identifyDocumentType(text: string): Promise<DocumentType> {
    const prompt = `Identify the legal document type from this text excerpt:
${text.substring(0, 2000)}

Choose from: contract, lease, brief, motion, complaint, discovery, correspondence, other
Respond with just the document type.`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: 'You are a legal document classifier. Respond with only the document type.' },
        { role: 'user', content: prompt },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 10,
      }) as OpenAI.Chat.ChatCompletion

      const type = completion.choices[0]?.message?.content?.trim().toLowerCase() as DocumentType
      return ['contract', 'lease', 'brief', 'motion', 'complaint', 'discovery', 'correspondence'].includes(type) 
        ? type 
        : 'other'
    } catch (error) {
      console.error('Failed to identify document type:', error)
      return 'other'
    }
  }

  private static async extractEntities(text: string): Promise<ExtractedEntity[]> {
    const prompt = `Extract legal entities from this document:
${text.substring(0, 4000)}

Return JSON array of entities with:
- type: person, organization, location, date, money, or legal_term
- value: the extracted value
- context: surrounding text (20-30 words)
- confidence: 0.0-1.0`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: 'You are a legal entity extractor. Extract all important entities.' },
        { role: 'user', content: prompt },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 2000,
      }) as OpenAI.Chat.ChatCompletion

      const response = completion.choices[0]?.message?.content || '[]'
      
      try {
        return JSON.parse(response)
      } catch {
        return []
      }
    } catch (error) {
      console.error('Failed to extract entities:', error)
      return []
    }
  }

  private static async extractKeyInformation(
    text: string,
    documentType: DocumentType
  ): Promise<KeyInformation> {
    const prompt = `Extract key information from this ${documentType}:
${text.substring(0, 4000)}

Return JSON with:
- parties: array of party names
- dates: {execution, effective, expiration, filing}
- amounts: {total, currency, payment_terms}
- jurisdiction: string
- governing_law: string
- case_number: string (if applicable)`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: 'You are a legal information extractor. Extract structured data from legal documents.' },
        { role: 'user', content: prompt },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 1000,
      }) as OpenAI.Chat.ChatCompletion

      const response = completion.choices[0]?.message?.content || '{}'
      
      try {
        return JSON.parse(response)
      } catch {
        return { parties: [], dates: {}, amounts: {} }
      }
    } catch (error) {
      console.error('Failed to extract key information:', error)
      return { parties: [], dates: {}, amounts: {} }
    }
  }

  private static async analyzeRisks(
    text: string,
    documentType: DocumentType
  ): Promise<RiskAssessment[]> {
    const prompt = `Analyze legal risks in this ${documentType}:
${text.substring(0, 4000)}

Identify potential risks and return JSON array with:
- type: category of risk
- severity: high, medium, or low
- description: detailed explanation
- recommendation: how to address
- location: where in document`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: 'You are a legal risk analyst. Identify potential issues and risks in legal documents.' },
        { role: 'user', content: prompt },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.5,
        maxTokens: 2000,
      }) as OpenAI.Chat.ChatCompletion

      const response = completion.choices[0]?.message?.content || '[]'
      
      try {
        return JSON.parse(response)
      } catch {
        return []
      }
    } catch (error) {
      console.error('Failed to analyze risks:', error)
      return []
    }
  }

  private static async analyzeClauses(
    text: string,
    documentType: DocumentType
  ): Promise<ClauseAnalysis[]> {
    if (!['contract', 'lease'].includes(documentType)) {
      return []
    }

    const prompt = `Analyze clauses in this ${documentType}:
${text.substring(0, 6000)}

For each major clause, return JSON with:
- type: clause category
- title: clause name
- content: clause text (summarized if long)
- isStandard: boolean
- concerns: array of potential issues
- suggestions: array of improvements`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: 'You are a contract analyst. Analyze clauses for completeness and fairness.' },
        { role: 'user', content: prompt },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.4,
        maxTokens: 3000,
      }) as OpenAI.Chat.ChatCompletion

      const response = completion.choices[0]?.message?.content || '[]'
      
      try {
        return JSON.parse(response)
      } catch {
        return []
      }
    } catch (error) {
      console.error('Failed to analyze clauses:', error)
      return []
    }
  }

  private static async generateSummary(
    text: string,
    documentType: DocumentType
  ): Promise<string> {
    const prompt = `Provide a comprehensive summary of this ${documentType}:
${text.substring(0, 6000)}

Include:
1. Main purpose and parties
2. Key terms and conditions
3. Important dates and deadlines
4. Financial obligations
5. Notable provisions

Keep it concise but thorough (200-300 words).`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: 'You are a legal document summarizer. Create clear, comprehensive summaries.' },
        { role: 'user', content: prompt },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.5,
        maxTokens: 500,
      }) as OpenAI.Chat.ChatCompletion

      return completion.choices[0]?.message?.content || 'Summary generation failed.'
    } catch (error) {
      console.error('Failed to generate summary:', error)
      return 'Summary generation failed.'
    }
  }

  static async processDocument(
    file: Buffer,
    fileName: string,
    options: ProcessingOptions = {}
  ): Promise<DocumentAnalysis> {
    const startTime = Date.now()
    const {
      extractEntities = true,
      analyzeRisks = true,
      identifyClauses = true,
      generateSummary = true,
      maxPages = 100,
      language = 'en',
    } = options

    try {
      // Extract text from file
      const { text, pageCount } = await this.extractTextFromFile(file, fileName)

      if (pageCount > maxPages) {
        throw new AIError(
          `Document exceeds maximum page limit (${maxPages})`,
          'PAGE_LIMIT_EXCEEDED',
          400,
          { pageCount, maxPages }
        )
      }

      // Check token count
      const tokenCount = countTokens(text)
      if (tokenCount > 50000) {
        throw new AIError(
          'Document is too large for processing',
          'DOCUMENT_TOO_LARGE',
          400,
          { tokenCount }
        )
      }

      // Process document in parallel where possible
      const [
        documentType,
        entities,
        keyInfo,
        risks,
        clauses,
        summary,
      ] = await Promise.all([
        this.identifyDocumentType(text),
        extractEntities ? this.extractEntities(text) : Promise.resolve([]),
        this.extractKeyInformation(text, 'contract'), // Will be updated with actual type
        analyzeRisks ? this.analyzeRisks(text, 'contract') : Promise.resolve([]),
        identifyClauses ? this.analyzeClauses(text, 'contract') : Promise.resolve([]),
        generateSummary ? this.generateSummary(text, 'contract') : Promise.resolve(''),
      ])

      // Calculate metadata
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
      const processingTime = Date.now() - startTime

      return {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName,
        fileType: fileName.split('.').pop() || 'unknown',
        processedAt: new Date(),
        summary,
        documentType,
        entities,
        keyInformation: keyInfo,
        risks,
        clauses,
        metadata: {
          pageCount,
          wordCount,
          language,
          readabilityScore: this.calculateReadability(text),
          processingTime,
        },
      }
    } catch (error) {
      if (error instanceof AIError) {
        throw error
      }
      throw new AIError(
        'Failed to process document',
        'PROCESSING_ERROR',
        500,
        { fileName, error }
      )
    }
  }

  private static calculateReadability(text: string): number {
    // Simple readability calculation
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/).filter(w => w.length > 0)
    
    if (sentences.length === 0 || words.length === 0) return 0

    const avgWordsPerSentence = words.length / sentences.length
    const complexWords = words.filter(w => w.length > 6).length
    const percentComplexWords = (complexWords / words.length) * 100

    // Gunning Fog Index
    const fogIndex = 0.4 * (avgWordsPerSentence + percentComplexWords)
    
    // Convert to 0-100 scale (lower fog index = higher readability)
    return Math.max(0, Math.min(100, 100 - (fogIndex * 3)))
  }

  static async compareDocuments(
    doc1: Buffer,
    doc1Name: string,
    doc2: Buffer,
    doc2Name: string
  ): Promise<{
    similarity: number
    differences: Array<{
      section: string
      doc1Content: string
      doc2Content: string
      significance: 'major' | 'minor'
    }>
    summary: string
  }> {
    try {
      const [text1Data, text2Data] = await Promise.all([
        this.extractTextFromFile(doc1, doc1Name),
        this.extractTextFromFile(doc2, doc2Name),
      ])

      const prompt = `Compare these two legal documents and identify differences:

Document 1:
${text1Data.text.substring(0, 3000)}

Document 2:
${text2Data.text.substring(0, 3000)}

Return JSON with:
- similarity: percentage (0-100)
- differences: array of {section, doc1Content, doc2Content, significance: "major" or "minor"}
- summary: brief comparison summary`

      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: 'You are a legal document comparison expert.' },
        { role: 'user', content: prompt },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 2000,
      }) as OpenAI.Chat.ChatCompletion

      const response = completion.choices[0]?.message?.content || '{}'
      
      try {
        return JSON.parse(response)
      } catch {
        return {
          similarity: 0,
          differences: [],
          summary: 'Comparison failed',
        }
      }
    } catch (error) {
      throw new AIError(
        'Failed to compare documents',
        'COMPARISON_ERROR',
        500,
        { error }
      )
    }
  }

  static async generateDocumentFromTemplate(
    templateType: 'contract' | 'nda' | 'lease' | 'brief',
    parameters: Record<string, any>
  ): Promise<{
    content: string
    metadata: {
      clauses: string[]
      customizations: string[]
      warnings: string[]
    }
  }> {
    const prompt = `Generate a legal ${templateType} with these parameters:
${JSON.stringify(parameters, null, 2)}

Create a professional, legally sound document that includes:
1. All standard clauses for this document type
2. Customizations based on the parameters
3. Proper legal formatting

Return JSON with:
- content: the full document text with proper formatting
- metadata: {clauses: array of included clauses, customizations: what was customized, warnings: any concerns}`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: 'You are a legal document generator. Create professional, complete legal documents.' },
        { role: 'user', content: prompt },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.4,
        maxTokens: 4000,
      }) as OpenAI.Chat.ChatCompletion

      const response = completion.choices[0]?.message?.content || '{}'
      
      try {
        return JSON.parse(response)
      } catch {
        return {
          content: response,
          metadata: {
            clauses: [],
            customizations: [],
            warnings: [],
          },
        }
      }
    } catch (error) {
      throw new AIError(
        'Failed to generate document',
        'GENERATION_ERROR',
        500,
        { templateType, error }
      )
    }
  }
}

// Export singleton instance
export const documentProcessor = DocumentProcessor