import { openAIClient, ConversationContext, streamChatCompletion, AIError, countTokens } from './openai-client'
import type { OpenAI } from './openai-client'

// Chat service configuration
export interface ChatConfig {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

// Message types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    tokens?: number
    model?: string
    functionCall?: any
  }
}

// Conversation session
export class ChatSession {
  private context: ConversationContext
  private messages: ChatMessage[] = []
  private config: Required<ChatConfig>

  constructor(sessionId: string, config: ChatConfig = {}) {
    this.config = {
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 1000,
      systemPrompt: config.systemPrompt || this.getDefaultSystemPrompt(),
    }

    this.context = new ConversationContext(
      this.config.systemPrompt,
      4000,
      this.config.model
    )
  }

  private getDefaultSystemPrompt(): string {
    return `You are HODOS AI, an intelligent legal assistant powered by HODOS 360's advanced AI technology. 
You help law firms with:
- Case management and legal research
- Document analysis and generation
- Client intake and communication
- Marketing and SEO optimization
- Practice management automation

You are professional, knowledgeable, and focused on providing accurate legal tech assistance. 
You always maintain client confidentiality and follow legal ethics guidelines.`
  }

  async sendMessage(content: string): Promise<ChatMessage> {
    // Create user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      metadata: {
        tokens: countTokens(content, this.config.model),
      },
    }

    this.messages.push(userMessage)
    this.context.addMessage('user', content)

    try {
      // Get AI response
      const completion = await openAIClient.createChatCompletion(
        this.context.getMessages(),
        {
          model: this.config.model,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
          stream: false,
        }
      ) as OpenAI.Chat.ChatCompletion

      const assistantContent = completion.choices[0]?.message?.content || ''
      
      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        metadata: {
          tokens: completion.usage?.total_tokens,
          model: completion.model,
        },
      }

      this.messages.push(assistantMessage)
      this.context.addMessage('assistant', assistantContent)

      return assistantMessage
    } catch (error) {
      if (error instanceof AIError) {
        throw error
      }
      throw new AIError(
        'Failed to get AI response',
        'CHAT_ERROR',
        500,
        { originalError: error }
      )
    }
  }

  async *streamMessage(content: string): AsyncGenerator<string, ChatMessage, unknown> {
    // Create user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      metadata: {
        tokens: countTokens(content, this.config.model),
      },
    }

    this.messages.push(userMessage)
    this.context.addMessage('user', content)

    let fullResponse = ''
    
    try {
      // Stream AI response
      for await (const chunk of streamChatCompletion(
        this.context.getMessages(),
        {
          model: this.config.model,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
        }
      )) {
        fullResponse += chunk
        yield chunk
      }

      // Create complete assistant message
      const assistantMessage: ChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        metadata: {
          tokens: countTokens(fullResponse, this.config.model),
          model: this.config.model,
        },
      }

      this.messages.push(assistantMessage)
      this.context.addMessage('assistant', fullResponse)

      return assistantMessage
    } catch (error) {
      if (error instanceof AIError) {
        throw error
      }
      throw new AIError(
        'Failed to stream AI response',
        'STREAM_ERROR',
        500,
        { originalError: error }
      )
    }
  }

  getMessages(): ChatMessage[] {
    return [...this.messages]
  }

  clearHistory() {
    this.messages = []
    this.context.clear()
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Legal-specific chat functions
export class LegalChatService {
  static async analyzeLegalDocument(documentText: string): Promise<{
    summary: string
    keyPoints: string[]
    legalIssues: string[]
    recommendations: string[]
  }> {
    const systemPrompt = `You are a legal document analyzer. Analyze the provided document and extract:
1. A concise summary
2. Key legal points
3. Potential legal issues or concerns
4. Recommendations for the legal team

Format your response as a JSON object with keys: summary, keyPoints, legalIssues, recommendations`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: documentText },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 2000,
      }) as OpenAI.Chat.ChatCompletion

      const response = completion.choices[0]?.message?.content || '{}'
      
      // Parse JSON response
      try {
        return JSON.parse(response)
      } catch {
        // Fallback if response isn't valid JSON
        return {
          summary: response,
          keyPoints: [],
          legalIssues: [],
          recommendations: [],
        }
      }
    } catch (error) {
      throw new AIError(
        'Failed to analyze legal document',
        'DOCUMENT_ANALYSIS_ERROR',
        500,
        { originalError: error }
      )
    }
  }

  static async generateLegalBrief(caseDetails: {
    title: string
    facts: string
    legalIssues: string
    jurisdiction: string
  }): Promise<string> {
    const systemPrompt = `You are a legal brief writer. Generate a professional legal brief based on the provided case details.
Include:
1. Case caption
2. Statement of facts
3. Legal issues presented
4. Applicable law and analysis
5. Conclusion

Use proper legal formatting and citations where applicable.`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(caseDetails) },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.5,
        maxTokens: 3000,
      }) as OpenAI.Chat.ChatCompletion

      return completion.choices[0]?.message?.content || ''
    } catch (error) {
      throw new AIError(
        'Failed to generate legal brief',
        'BRIEF_GENERATION_ERROR',
        500,
        { originalError: error }
      )
    }
  }

  static async performLegalResearch(query: string, jurisdiction?: string): Promise<{
    cases: Array<{ title: string; citation: string; relevance: string }>
    statutes: Array<{ title: string; section: string; summary: string }>
    analysis: string
  }> {
    const systemPrompt = `You are a legal research assistant. For the given legal query${jurisdiction ? ` in ${jurisdiction}` : ''}:
1. Identify relevant case law (provide fictional but realistic citations)
2. Identify applicable statutes
3. Provide analysis of how these authorities apply

Format as JSON with keys: cases (array), statutes (array), analysis (string)`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.4,
        maxTokens: 2000,
      }) as OpenAI.Chat.ChatCompletion

      const response = completion.choices[0]?.message?.content || '{}'
      
      try {
        return JSON.parse(response)
      } catch {
        return {
          cases: [],
          statutes: [],
          analysis: response,
        }
      }
    } catch (error) {
      throw new AIError(
        'Failed to perform legal research',
        'RESEARCH_ERROR',
        500,
        { originalError: error }
      )
    }
  }
}

// Chat session manager
export class ChatSessionManager {
  private static sessions = new Map<string, ChatSession>()

  static createSession(sessionId: string, config?: ChatConfig): ChatSession {
    const session = new ChatSession(sessionId, config)
    this.sessions.set(sessionId, session)
    return session
  }

  static getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId)
  }

  static deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }

  static clearInactiveSessions(maxAge: number = 3600000) {
    // Clear sessions older than maxAge (default 1 hour)
    const now = Date.now()
    for (const [id, session] of this.sessions.entries()) {
      const messages = session.getMessages()
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && now - lastMessage.timestamp.getTime() > maxAge) {
        this.sessions.delete(id)
      }
    }
  }
}

// Export default instance
export const chatService = {
  createSession: (config?: ChatConfig) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return ChatSessionManager.createSession(sessionId, config)
  },
  getSession: ChatSessionManager.getSession.bind(ChatSessionManager),
  legal: LegalChatService,
}