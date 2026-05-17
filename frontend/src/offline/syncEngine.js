import { getPendingCollections, deleteCollection } from './db';
import api from '@/api/axios';
import useNetworkStore from './networkManager';
import { toast } from 'sonner';

export const flushSyncQueue = async () => {
  const { isOnline, isSyncing, setSyncing, setPendingCount } = useNetworkStore.getState();
  
  if (!isOnline || isSyncing) return;
  
  const pending = await getPendingCollections();
  setPendingCount(pending.length);
  
  if (pending.length === 0) return;
  
  setSyncing(true);
  console.log(`SyncEngine: Starting sync for ${pending.length} items...`);
  
  for (const item of pending) {
    try {
      const formData = new FormData();
      formData.append('customerId', item.customerId);
      formData.append('amountCollected', item.amountCollected);
      formData.append('paymentMode', item.paymentMode);
      formData.append('notes', item.notes || '');
      formData.append('clientGeneratedId', item.clientGeneratedId);
      formData.append('deviceId', item.deviceId);
      
      if (item.receiptImageBlob) {
        const file = new File([item.receiptImageBlob], 'receipt.jpg', { type: 'image/jpeg' });
        formData.append('receiptImage', file);
      }
      
      await api.post('/collections', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await deleteCollection(item.id);
      console.log(`SyncEngine: Synced item ${item.clientGeneratedId}`);
    } catch (error) {
      console.error(`SyncEngine: Failed to sync item ${item.clientGeneratedId}`, error);
      // Keep in queue for next retry
    }
  }
  
  const remaining = await getPendingCollections();
  setPendingCount(remaining.length);
  setSyncing(false);
  
  if (remaining.length === 0) {
    toast.success('All offline collections synchronized!');
  } else {
    toast.error(`${remaining.length} items failed to sync. Will retry soon.`);
  }
};

// Auto-trigger sync when online
window.addEventListener('online', flushSyncQueue);

// Interval check (every 30 seconds if online)
setInterval(flushSyncQueue, 30000);
