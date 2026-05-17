import { create } from 'zustand';

const useNetworkStore = create((set) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingCount: 0,
  
  setOnline: (status) => set({ isOnline: status }),
  setSyncing: (status) => set({ isSyncing: status }),
  setPendingCount: (count) => set({ pendingCount: count }),
}));

export default useNetworkStore;

// Listeners
window.addEventListener('online', () => useNetworkStore.getState().setOnline(true));
window.addEventListener('offline', () => useNetworkStore.getState().setOnline(false));
