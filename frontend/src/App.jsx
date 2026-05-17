import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
// Context removed for Zustand
import AppRouter from '@/routes/AppRouter';
import SyncStatusWidget from '@/components/SyncStatusWidget';
import GlobalListeners from '@/components/GlobalListeners';
import '@/offline/syncEngine'; // Initialize sync engine listeners

export default function App() {
  return (
    <BrowserRouter>
      <>
        <AppRouter />
        <GlobalListeners />
        <SyncStatusWidget />
        <Toaster richColors position="top-center" />
      </>
    </BrowserRouter>
  );
}
