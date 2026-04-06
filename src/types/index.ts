import React from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Visualization metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface VisualizationProps {
  isPlaying: boolean
  speed: number
  isFocusMode: boolean
  onConceptInteract?: (concept: string) => void
}

export interface VisualizationMeta {
  id: string
  topic: string
  title: string
  conceptTags: string[]
  difficultyLevel: 1 | 2 | 3
  commonMisconceptions: string[]
  recommendedUseCases: string[]
  caption: { what: string; why: string; notice: string }
  component: React.LazyExoticComponent<React.ComponentType<VisualizationProps>>
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation controls
// ─────────────────────────────────────────────────────────────────────────────

export interface AnimationControlsProps {
  isPlaying: boolean
  speed: number
  onPlay: () => void
  onPause: () => void
  onReplay: () => void
  onSpeedChange: (speed: number) => void
  onStepForward?: () => void
  isFocusMode: boolean
  onToggleFocusMode: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Tutor chat
// ─────────────────────────────────────────────────────────────────────────────

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// Practice / quiz
// ─────────────────────────────────────────────────────────────────────────────

export interface PracticeQuestion {
  id: string
  topicId: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 1 | 2 | 3
}

// ─────────────────────────────────────────────────────────────────────────────
// User / auth
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  role: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Practice session config and history
// ─────────────────────────────────────────────────────────────────────────────

export interface PracticeConfig {
  topicIds: string[]
  totalQuestions: number
  mcqCount: number
  frqCount: number
  difficulty: 0 | 1 | 2 | 3  // 0 = all difficulties
}

export interface PracticeAttempt {
  id: string
  topicIds: string[]
  score: number
  total: number
  completedAt: Date
}
