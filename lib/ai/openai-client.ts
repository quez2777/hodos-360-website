import OpenAI from 'openai'
import { encoding_for_model } from 'tiktoken'

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new AIError(
        'OpenAI API key not configured',
        'CONFIG_ERROR',
        500,
        { message: 'OPENAI_API_KEY environment variable is required' }
      )
    }
    
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: false, // Only use server-side
    })
  }
  
  return openai
}

// Token counting utilities
export function countTokens(text: string, model: string = 'gpt-4-turbo-preview'): number {
  try {
    const encoding = encoding_for_model(model as any)
    const tokens = encoding.encode(text)
    encoding.free()
    return tokens.length
  } catch (error) {
    // Fallback to approximate counting (roughly 4 chars per token)
    return Math.ceil(text.length / 4)
  }
}

// Rate limiting configuration
const RATE_LIMITS = {
  requestsPerMinute: 60,
  tokensPerMinute: 90000,
  requestsPerDay: 10000,
}

// Rate limiter implementation
class RateLimiter {
  private requests: { timestamp: number; tokens: number }[] = []

  canMakeRequest(estimatedTokens: number): { allowed: boolean; waitTime?: number } {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const oneDayAgo = now - 86400000

    // Clean old requests
    this.requests = this.requests.filter(req => req.timestamp > oneDayAgo)

    // Check minute limits
    const recentRequests = this.requests.filter(req => req.timestamp > oneMinuteAgo)
    const recentTokens = recentRequests.reduce((sum, req) => sum + req.tokens, 0)

    if (recentRequests.length >= RATE_LIMITS.requestsPerMinute) {
      const oldestRequest = recentRequests[0]
      const waitTime = 60000 - (now - oldestRequest.timestamp)
      return { allowed: false, waitTime }
    }

    if (recentTokens + estimatedTokens > RATE_LIMITS.tokensPerMinute) {
      return { allowed: false, waitTime: 60000 }
    }

    // Check daily limit
    if (this.requests.length >= RATE_LIMITS.requestsPerDay) {
      return { allowed: false, waitTime: 86400000 }
    }

    return { allowed: true }
  }

  recordRequest(tokens: number) {
    this.requests.push({ timestamp: Date.now(), tokens })
  }
}

const rateLimiter = new RateLimiter()

// Error handling wrapper
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AIError'
  }
}

// Main OpenAI client wrapper with error handling
export class OpenAIClient {
  async createChatCompletion(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: {
      model?: string
      temperature?: number
      maxTokens?: number
      stream?: boolean
      functions?: OpenAI.Chat.ChatCompletionCreateParams.Function[]
    } = {}
  ) {
    const {
      model = 'gpt-4-turbo-preview',
      temperature = 0.7,
      maxTokens = 1000,
      stream = false,
      functions,
    } = options

    // Count tokens
    const messageText = messages.map(m => m.content).join(' ')
    const estimatedTokens = countTokens(messageText, model) + maxTokens

    // Check rate limits
    const rateCheck = rateLimiter.canMakeRequest(estimatedTokens)
    if (!rateCheck.allowed) {
      throw new AIError(
        'Rate limit exceeded',
        'RATE_LIMIT',
        429,
        { waitTime: rateCheck.waitTime }
      )
    }

    try {
      const client = getOpenAIClient()
      const completion = await client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
        functions,
      })

      // Record the request
      if (!stream) {
        const response = completion as OpenAI.Chat.ChatCompletion
        const usedTokens = response.usage?.total_tokens || estimatedTokens
        rateLimiter.recordRequest(usedTokens)
      } else {
        // For streaming, record estimated tokens
        rateLimiter.recordRequest(estimatedTokens)
      }

      return completion
    } catch (error: any) {
      // Handle OpenAI API errors
      if (error.response) {
        const status = error.response.status
        const message = error.response.data?.error?.message || 'OpenAI API error'

        switch (status) {
          case 401:
            throw new AIError('Invalid API key', 'AUTH_ERROR', 401)
          case 429:
            throw new AIError('OpenAI rate limit exceeded', 'OPENAI_RATE_LIMIT', 429)
          case 500:
          case 502:
          case 503:
            throw new AIError('OpenAI service unavailable', 'SERVICE_ERROR', 503)
          default:
            throw new AIError(message, 'API_ERROR', status)
        }
      }

      // Network or other errors
      throw new AIError(
        'Failed to connect to OpenAI',
        'CONNECTION_ERROR',
        500,
        { originalError: error.message }
      )
    }
  }

  async createEmbedding(input: string | string[], model = 'text-embedding-3-small') {
    const text = Array.isArray(input) ? input.join(' ') : input
    const estimatedTokens = countTokens(text, model)

    const rateCheck = rateLimiter.canMakeRequest(estimatedTokens)
    if (!rateCheck.allowed) {
      throw new AIError(
        'Rate limit exceeded',
        'RATE_LIMIT',
        429,
        { waitTime: rateCheck.waitTime }
      )
    }

    try {
      const client = getOpenAIClient()
      const response = await client.embeddings.create({
        model,
        input,
      })

      rateLimiter.recordRequest(estimatedTokens)
      return response
    } catch (error: any) {
      throw new AIError(
        'Failed to create embeddings',
        'EMBEDDING_ERROR',
        500,
        { originalError: error.message }
      )
    }
  }

  async moderateContent(input: string) {
    try {
      const client = getOpenAIClient()
      const response = await client.moderations.create({ input })
      return response
    } catch (error: any) {
      throw new AIError(
        'Failed to moderate content',
        'MODERATION_ERROR',
        500,
        { originalError: error.message }
      )
    }
  }
}

// Export singleton instance
export const openAIClient = new OpenAIClient()

// Streaming response handler
export async function* streamChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: Parameters<OpenAIClient['createChatCompletion']>[1] = {}
) {
  const stream = await openAIClient.createChatCompletion(messages, {
    ...options,
    stream: true,
  }) as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}

// Context management utilities
export class ConversationContext {
  private messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
  private maxTokens: number
  private model: string

  constructor(
    systemPrompt: string,
    maxTokens = 4000,
    model = 'gpt-4-turbo-preview'
  ) {
    this.maxTokens = maxTokens
    this.model = model
    this.messages.push({ role: 'system', content: systemPrompt })
  }

  addMessage(role: 'user' | 'assistant', content: string) {
    this.messages.push({ role, content })
    this.trimContext()
  }

  private trimContext() {
    // Keep system message and trim old messages if context is too long
    while (this.getTokenCount() > this.maxTokens && this.messages.length > 2) {
      // Remove the second message (keeping system prompt)
      this.messages.splice(1, 1)
    }
  }

  private getTokenCount(): number {
    const text = this.messages.map(m => m.content).join(' ')
    return countTokens(text, this.model)
  }

  getMessages() {
    return [...this.messages]
  }

  clear() {
    // Keep only system message
    this.messages = this.messages.slice(0, 1)
  }
}

// Export types
export type { OpenAI }