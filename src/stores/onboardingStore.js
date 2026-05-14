import { create } from 'zustand'

export const useOnboardingStore = create((set) => ({
  fullName: '',
  age: '',
  experienceLevel: '',
  direction: 1, // 1 = forward, -1 = backward

  setData: (patch) => set(patch),
  setDirection: (direction) => set({ direction }),
  initFromUser: (user) =>
    set((state) => ({
      fullName: state.fullName || user?.user_metadata?.full_name || '',
    })),
  reset: () => set({ fullName: '', age: '', experienceLevel: '', direction: 1 }),
}))
