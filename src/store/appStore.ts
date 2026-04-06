import { create } from 'zustand'

interface AppState {
  // ── Navigation / topic ────────────────────────────────────────────────────
  currentTopic: string | null
  currentVisualizationId: string | null
  currentTopicTitle: string | null

  // ── UI state ──────────────────────────────────────────────────────────────
  isFocusMode: boolean
  tutorOpen: boolean
  tutorContext: string

  // ── Learning progress ─────────────────────────────────────────────────────
  progress: Record<string, boolean>

  // ── User identity (mirrors auth, kept here for easy access across the app) ─
  userEmail: string | null
  displayName: string | null

  // ── Actions ───────────────────────────────────────────────────────────────
  setCurrentTopic: (topic: string | null, title?: string | null) => void
  setCurrentVisualizationId: (id: string | null) => void
  setFocusMode: (val: boolean) => void
  setTutorOpen: (val: boolean) => void
  setTutorContext: (ctx: string) => void
  markProgress: (topicId: string) => void
  setUser: (email: string | null, displayName: string | null) => void
  clearUser: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // ── Initial state ─────────────────────────────────────────────────────────
  currentTopic: null,
  currentVisualizationId: null,
  currentTopicTitle: null,

  isFocusMode: false,
  tutorOpen: false,
  tutorContext: '',

  progress: {},

  userEmail: null,
  displayName: null,

  // ── Actions ───────────────────────────────────────────────────────────────
  setCurrentTopic: (topic, title = null) =>
    set({
      currentTopic: topic,
      currentVisualizationId: topic,
      currentTopicTitle: title ?? topic,
      tutorContext: topic ? `Student is viewing: ${title ?? topic}` : '',
    }),

  setCurrentVisualizationId: (id) => set({ currentVisualizationId: id }),

  setFocusMode: (val) => set({ isFocusMode: val }),

  setTutorOpen: (val) => set({ tutorOpen: val }),

  setTutorContext: (ctx) => set({ tutorContext: ctx }),

  markProgress: (topicId) =>
    set((s) => ({ progress: { ...s.progress, [topicId]: true } })),

  setUser: (email, displayName) => set({ userEmail: email, displayName }),

  clearUser: () => set({ userEmail: null, displayName: null }),
}))
