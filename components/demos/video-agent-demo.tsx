'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Video, Phone, Mic, MicOff, VideoOff, 
  MessageSquare, ThumbsUp, Brain, Play, 
  Pause, Users, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface TranscriptEntry {
  speaker: 'agent' | 'client'
  text: string
  timestamp: string
  sentiment?: 'positive' | 'neutral' | 'negative'
}

interface KeyPoint {
  point: string
  importance: 'high' | 'medium' | 'low'
}

const DEMO_TRANSCRIPT: TranscriptEntry[] = [
  {
    speaker: 'agent',
    text: "Good morning! I'm Sarah from Smith & Associates Law Firm. How can I help you today?",
    timestamp: '0:00',
    sentiment: 'positive'
  },
  {
    speaker: 'client',
    text: "Hi Sarah, I was in a car accident last week and I think I need legal representation.",
    timestamp: '0:08',
    sentiment: 'negative'
  },
  {
    speaker: 'agent',
    text: "I'm sorry to hear about your accident. Let me gather some information to see how we can best assist you. Were you injured in the accident?",
    timestamp: '0:16',
    sentiment: 'neutral'
  },
  {
    speaker: 'client',
    text: "Yes, I have whiplash and my back has been hurting. I've been to the doctor twice already.",
    timestamp: '0:25',
    sentiment: 'negative'
  },
  {
    speaker: 'agent',
    text: "I understand. It's important that you're getting medical attention. Have you spoken with the insurance company yet?",
    timestamp: '0:33',
    sentiment: 'neutral'
  },
  {
    speaker: 'client',
    text: "They called me but I wasn't sure what to say. I'm worried I might say something wrong.",
    timestamp: '0:42',
    sentiment: 'negative'
  },
  {
    speaker: 'agent',
    text: "You did the right thing by being cautious. We always advise clients to speak with an attorney before giving any statements. I'd like to schedule a consultation with one of our personal injury attorneys. Would tomorrow at 2 PM work for you?",
    timestamp: '0:50',
    sentiment: 'positive'
  },
  {
    speaker: 'client',
    text: "Yes, that would be perfect. Thank you so much for your help!",
    timestamp: '1:05',
    sentiment: 'positive'
  }
]

const KEY_POINTS: KeyPoint[] = [
  { point: 'Client was in car accident last week', importance: 'high' },
  { point: 'Client has injuries: whiplash and back pain', importance: 'high' },
  { point: 'Client has visited doctor twice', importance: 'medium' },
  { point: 'Insurance company has made contact', importance: 'high' },
  { point: 'Client has not given statement yet', importance: 'high' },
  { point: 'Consultation scheduled for tomorrow 2 PM', importance: 'medium' }
]

export function VideoAgentDemo() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const [visibleTranscript, setVisibleTranscript] = useState<number>(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPlaying && currentTime < 65) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1
          
          // Show transcript entries based on time
          if (next === 8) setVisibleTranscript(1)
          if (next === 16) setVisibleTranscript(2)
          if (next === 25) setVisibleTranscript(3)
          if (next === 33) setVisibleTranscript(4)
          if (next === 42) setVisibleTranscript(5)
          if (next === 50) setVisibleTranscript(6)
          if (next === 65) {
            setVisibleTranscript(7)
            setIsPlaying(false)
          }
          
          return next
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isPlaying, currentTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'border-green-500/30 bg-green-500/10'
      case 'negative':
        return 'border-red-500/30 bg-red-500/10'
      default:
        return 'border-blue-500/30 bg-blue-500/10'
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  }

  const handlePlayPause = () => {
    if (currentTime >= 65) {
      setCurrentTime(0)
      setVisibleTranscript(0)
    }
    setIsPlaying(!isPlaying)
    if (!showTranscript) {
      setShowTranscript(true)
    }
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-md bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-800/20 overflow-hidden"
        >
          {/* Video Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <Video className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">AI Video Agent</h3>
                  <p className="text-sm text-gray-300">Intelligent reception & intake</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-300">LIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Screen */}
          <div className="relative aspect-video bg-gray-900">
            {!isVideoOff ? (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                <motion.div
                  animate={{ scale: isPlaying ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
                  className="relative"
                >
                  <Users className="h-24 w-24 text-white/20" />
                  {isPlaying && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Brain className="h-16 w-16 text-purple-400" />
                    </motion.div>
                  )}
                </motion.div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <VideoOff className="h-12 w-12 text-gray-600" />
              </div>
            )}

            {/* Play Overlay */}
            {!isPlaying && currentTime === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50"
              >
                <Button
                  onClick={handlePlayPause}
                  size="lg"
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30"
                >
                  <Play className="h-6 w-6 mr-2" />
                  Start Demo
                </Button>
              </motion.div>
            )}

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="space-y-2">
                <Progress value={(currentTime / 65) * 100} className="h-1" />
                <div className="flex justify-between text-xs text-white/70">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(65)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/10"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/10"
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className="text-white hover:bg-white/10"
                >
                  {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-white hover:bg-white/10"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analysis Panel */}
        <div className="space-y-6">
          {/* Real-time Transcript */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-md bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-800/20 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                Real-time Transcript
              </h4>
            </div>
            
            <div className="h-64 overflow-y-auto p-4">
              <AnimatePresence mode="sync">
                {showTranscript && DEMO_TRANSCRIPT.slice(0, visibleTranscript + 1).map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'mb-3 p-3 rounded-lg border',
                      getSentimentColor(entry.sentiment)
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-medium text-gray-400">
                        {entry.speaker === 'agent' ? 'AI Agent' : 'Client'}
                      </span>
                      <span className="text-xs text-gray-500">{entry.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-200">{entry.text}</p>
                    {entry.sentiment && (
                      <div className="mt-2 flex items-center gap-2">
                        <ThumbsUp className={cn(
                          'h-3 w-3',
                          entry.sentiment === 'positive' ? 'text-green-400' :
                          entry.sentiment === 'negative' ? 'text-red-400' :
                          'text-blue-400'
                        )} />
                        <span className="text-xs text-gray-400 capitalize">{entry.sentiment}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {!showTranscript && (
                <div className="text-center text-gray-400 mt-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Start the demo to see real-time transcription</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Key Points */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-md bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-800/20 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                AI Analysis - Key Points
              </h4>
            </div>
            
            <div className="p-4 space-y-2">
              <AnimatePresence>
                {(isPlaying || currentTime > 0) && KEY_POINTS.map((point, index) => (
                  <motion.div
                    key={point.point}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-lg border',
                      getImportanceColor(point.importance)
                    )}
                  >
                    <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{point.point}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {currentTime === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">AI will extract key points during the call</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute bottom-0 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      </div>
    </div>
  )
}