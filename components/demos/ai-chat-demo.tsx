'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
}

const DEMO_RESPONSES = {
  'contract review': {
    response: "I'll analyze your contract for key terms, potential risks, and compliance issues. I can identify problematic clauses, suggest improvements, and ensure alignment with current regulations. Would you like me to focus on any specific areas?",
    followUp: "I can also compare it against industry standards and previous successful contracts in your database."
  },
  'case research': {
    response: "I can search through millions of cases to find relevant precedents for your case. I'll analyze similar cases, extract key arguments, and provide a comprehensive research memo with citations. What type of case are you working on?",
    followUp: "I'll also identify opposing counsel's likely arguments and suggest counter-strategies."
  },
  'document drafting': {
    response: "I can draft various legal documents including motions, briefs, contracts, and letters. I'll ensure proper formatting, cite relevant authorities, and maintain your firm's preferred style. What type of document do you need?",
    followUp: "All documents are tailored to your jurisdiction and include the latest legal requirements."
  },
  'client intake': {
    response: "I can handle initial client consultations, gather essential information, and automatically populate your case management system. I'll ask the right questions, identify potential conflicts, and schedule follow-up appointments.",
    followUp: "I can also perform preliminary case assessment and estimate potential outcomes."
  },
  'billing': {
    response: "I track time automatically, generate detailed invoices, and ensure compliance with billing guidelines. I can analyze your billing data to identify opportunities for improvement and flag any anomalies.",
    followUp: "Would you like to see a sample billing report or set up automated invoice generation?"
  },
  default: {
    response: "I'm HODOS AI, your legal assistant. I can help with contract review, case research, document drafting, client intake, billing, and much more. What legal task can I assist you with today?",
    followUp: "Try asking about specific tasks like 'review this contract' or 'research similar cases'."
  }
}

const SUGGESTED_QUERIES = [
  "Review a contract for risks",
  "Research case precedents",
  "Draft a legal document",
  "Handle client intake",
  "Analyze billing data"
]

export function AIChatDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm HODOS AI, your intelligent legal assistant. I can help with contract review, case research, document drafting, and more. Try asking me something!",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const simulateTyping = async (response: string, followUp?: string) => {
    setIsTyping(true)
    
    // Show typing indicator
    const typingMessage: Message = {
      id: Date.now().toString() + '-typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    }
    setMessages(prev => [...prev, typingMessage])

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Remove typing indicator and add actual message
    setMessages(prev => [
      ...prev.filter(m => !m.isTyping),
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
    ])

    // Add follow-up if exists
    if (followUp) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + '-followup',
          role: 'assistant',
          content: followUp,
          timestamp: new Date()
        }
      ])
    }

    setIsTyping(false)
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Find matching response
    const lowercaseInput = inputValue.toLowerCase()
    let response = DEMO_RESPONSES.default

    for (const [key, value] of Object.entries(DEMO_RESPONSES)) {
      if (lowercaseInput.includes(key)) {
        response = value
        break
      }
    }

    await simulateTyping(response.response, response.followUp)
  }

  const handleSuggestedQuery = (query: string) => {
    setInputValue(query)
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Glass container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-800/20 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <Sparkles className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">HODOS AI Assistant</h3>
              <p className="text-sm text-gray-300">Legal AI powered by advanced language models</p>
            </div>
          </div>
        </div>

        {/* Chat messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
                
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 backdrop-blur-sm border border-white/20'
                  )}
                >
                  {message.isTyping ? (
                    <div className="flex gap-1">
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                      />
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                      />
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                      />
                    </div>
                  ) : (
                    <p className={cn(
                      'text-sm',
                      message.role === 'user' ? 'text-white' : 'text-gray-200'
                    )}>
                      {message.content}
                    </p>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-full bg-gray-600">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested queries */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 flex-wrap">
            {SUGGESTED_QUERIES.map((query, index) => (
              <motion.button
                key={query}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSuggestedQuery(query)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 
                         border border-white/20 transition-colors text-gray-300 hover:text-white"
              >
                {query}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about contract review, case research, or any legal task..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              disabled={isTyping}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isTyping}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </motion.div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>
    </div>
  )
}