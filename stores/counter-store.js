import { create } from "zustand"

export const useCounterStore = create((set) => ({
    count: 0,
    decrementCount: () => set((state) => ({ count: state.count - 1 })),
    incrementCount: () => set((state) => ({ count: state.count + 1 })),
}))

