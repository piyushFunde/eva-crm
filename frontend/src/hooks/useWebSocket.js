import { useEffect } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { toast } from 'sonner';
import useAnalyticsStore from '@/store/analyticsStore';
import useCustomerStore from '@/store/customerStore';
import useNotificationStore from '@/store/notificationStore';

export const useWebSocket = () => {
  const { fetchOverview } = useAnalyticsStore();
  const { fetchHistory } = useCustomerStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const socket = new SockJS(import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws');
    const stompClient = Stomp.over(socket);
    
    stompClient.debug = null; // Disable debug logs in production

    stompClient.connect({}, () => {
      console.log('WS: Connected to EVA CRM Real-Time Server');
      
      stompClient.subscribe('/topic/collections', (message) => {
        const data = JSON.parse(message.body);
        
        // Live feedback
        toast.info(`New Collection: ₹${data.amountCollected}`, {
          description: `From ${data.customerName}`,
        });

        addNotification({
          title: 'Payment Received',
          message: `₹${data.amountCollected} collected from ${data.customerName}`,
          type: 'success'
        });

        // Trigger optimistic updates to dashboard
        fetchOverview();
        fetchHistory(1, 10);
      });
    }, (error) => {
      console.error('WS: Connection Error', error);
    });

    return () => {
      if (stompClient.connected) stompClient.disconnect();
    };
  }, []);
};
