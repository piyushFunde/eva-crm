import { useWebSocket } from '@/hooks/useWebSocket';

export default function GlobalListeners() {
  useWebSocket();
  return null;
}
