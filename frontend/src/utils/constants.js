// App-wide constants
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'EVA CRM';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Sync status values
export const SYNC_STATUS = {
  SYNCED: 'synced',
  PENDING: 'pending',
  OFFLINE: 'offline',
};

// Collection status values
export const COLLECTION_STATUS = {
  PENDING: 'pending',
  COLLECTED: 'collected',
  PARTIAL: 'partial',
};

// Payment modes
export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

// Navigation items (3-tab bottom nav)
export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/my-list', label: 'My List', icon: 'ClipboardList' },
  { path: '/admin', label: 'Admin', icon: 'Shield' },
];
