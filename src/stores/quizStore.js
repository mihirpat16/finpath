import { create } from 'zustand'

export const useQuizStore = create((set, get) => ({
  answers: {},   // { q1: 3, q2: 5, … }
  direction: 1,  // 1 = forward, -1 = backward

  setAnswer: (questionId, score) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: score } })),

  setDirection: (direction) => set({ direction }),

  getTotalScore: () =>
    Object.values(get().answers).reduce((sum, s) => sum + s, 0),

  reset: () => set({ answers: {}, direction: 1 }),
}))
